import { localize } from '@deriv/translations';
import { TStrategy } from '../../pages/bot-builder/quick-strategy/types';

// A quick-start strategy using Digit Frequency + Bulk Purchase.
// This config is used by the quick strategy picker to build a near-complete workspace.
export const MATCHES_FREQUENCY_BULK: TStrategy = {
    id: 'matches_frequency_bulk',
    title: localize('Matches (Top Digit Frequency) – Bulk'),
    description: localize('Uses Digit Frequency (last 30 ticks, top 7 DESC) to buy DIGITMATCH for each top digit sequentially.'),
    // Groups of fields rendered by QuickStrategyForm; we keep it simple and aligned to existing items.
    fields: [
        [
            { type: 'label', label: localize('Asset'), description: localize('Underlying market for this strategy.') },
            { type: 'symbol', name: 'symbol' },
        ],
        [
            { type: 'label', label: localize('Contract type'), description: localize('Each run uses this contract type.') },
            { type: 'tradetype', name: 'tradetype', dependencies: ['symbol'] },
            { type: 'contract_type', name: 'type', dependencies: ['symbol', 'tradetype'] },
        ],
        [
            { type: 'label', label: localize('Initial stake'), description: localize('Stake per bulk contract = Stake × number_of_digits.') },
            { type: 'number', name: 'stake', has_currency_unit: true, validation: ['number', 'required', 'ceil', { type: 'min', value: 1, getMessage: min => localize('Must be a number higher than {{ min }}', { min: Number(min) - 1 }) }] },
        ],
        [
            { type: 'label', label: localize('Duration'), description: localize('How long each trade takes to expire.') },
            { type: 'durationtype', name: 'durationtype', dependencies: ['symbol', 'tradetype'], attached: true },
            { type: 'number', name: 'duration', attached: true, validation: ['number', 'required', 'min', 'max'] },
        ],
        [
            { type: 'label', label: localize('Profit threshold'), description: localize('Stop if total profit exceeds this amount.') },
            { type: 'number', name: 'profit', has_currency_unit: true, validation: ['number', 'required', 'ceil', { type: 'min', value: 1, getMessage: min => localize('Must be a number higher than {{ min }}', { min: Number(min) - 1 }) }] },
        ],
        [
            { type: 'label', label: localize('Loss threshold'), description: localize('Stop if total loss exceeds this amount.') },
            { type: 'number', name: 'loss', has_currency_unit: true, validation: ['number', 'required', 'ceil', { type: 'min', value: 1, getMessage: min => localize('Must be a number higher than {{ min }}', { min: Number(min) - 1 }) }] },
        ],
    ],
    // Minimal defaults to make it runnable quickly; the workspace builder will wire the blocks:
    defaults: {
        symbol: 'R_10',
        tradetype: 'matchesdiffers',
        type: 'DIGITMATCH',
        stake: 1,
        durationtype: 't',
        duration: 5,
        profit: 10,
        loss: 10,
    },
};