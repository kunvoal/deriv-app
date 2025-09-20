import { purchaseSuccessful } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';
import { contractStatus, info, log } from '../utils/broadcast';
import { getUUID, recoverFromError, doUntilDone, tradeOptionToBuy } from '../utils/helpers';
import { LogTypes } from '../../../constants/messages';
import { api_base } from '../../api/api-base';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        setBulkPurchase(enabled, digits) {
            this.bulk = this.bulk || { enabled: false, digits: [], index: 0, base_amount: null, base_prediction: undefined };
            if (!enabled) {
                this.bulk = { enabled: false, digits: [], index: 0, base_amount: null, base_prediction: undefined };
                return true;
            }
            const normalized = Array.isArray(digits)
                ? digits
                      .map(d => Number(d))
                      .filter(n => Number.isFinite(n) && n >= 0 && n <= 9)
                : [];
            this.bulk.enabled = true;
            this.bulk.digits = normalized;
            this.bulk.index = 0;
            this.bulk.base_amount = this.tradeOptions?.amount ?? this.bulk.base_amount;
            this.bulk.base_prediction = this.tradeOptions?.prediction;
            return true;
        }
        purchase(contract_type) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE) {
                return Promise.resolve();
            }

            // Handle Bulk pre-configuration
            if (this.bulk?.enabled && Array.isArray(this.bulk.digits) && this.bulk.digits.length > 0) {
                const idx = Math.max(0, Math.min(this.bulk.index || 0, this.bulk.digits.length - 1));
                const current_digit = this.bulk.digits[idx];
                // Per-contract stake = base stake x number_of_digits
                const base_amount = this.bulk.base_amount ?? this.tradeOptions.amount;
                const n = this.bulk.digits.length;
                this.tradeOptions.amount = Number(base_amount) * n;
                this.tradeOptions.prediction = current_digit;
            }

            const onSuccess = response => {
                // Don't unnecessarily send a forget request for a purchased contract.
                const { buy } = response;

                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy.transaction_id,
                    buy,
                });

                this.contractId = buy.contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { longcode: buy.longcode, transaction_id: buy.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy.transaction_id },
                    contract_type,
                    buy_price: buy.buy_price,
                });

                // After successful purchase, advance bulk index or reset
                if (this.bulk?.enabled && Array.isArray(this.bulk.digits) && this.bulk.digits.length > 0) {
                    this.bulk.index = (this.bulk.index || 0) + 1;
                    if (this.bulk.index >= this.bulk.digits.length) {
                        // Completed bulk cycle; reset state and restore trade options
                        const base_amount = this.bulk.base_amount ?? this.tradeOptions.amount;
                        this.tradeOptions.amount = base_amount;
                        this.tradeOptions.prediction = this.bulk.base_prediction;
                        this.bulk = { enabled: false, digits: [], index: 0, base_amount: null, base_prediction: undefined };
                    }
                }
            };

            if (this.is_proposal_subscription_required) {
                const { id, askPrice } = this.selectProposal(contract_type);

                const action = () => api_base.api.send({ buy: id, price: askPrice });

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action).then(onSuccess);
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                ).then(onSuccess);
            }
            const trade_option = tradeOptionToBuy(contract_type, this.tradeOptions);
            const action = () => api_base.api.send(trade_option);

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action).then(onSuccess);
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            ).then(onSuccess);
        }
        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
