import { useFormikContext } from 'formik';
import { useStore } from '@deriv/stores';
import { useDBotStore } from 'Stores/useDBotStore';
import { rudderStackSendQsRunStrategyEvent } from '../../../../analytics/rudderstack-quick-strategy';
import { TFormValues } from '../types';

const useQsSubmitHandler = () => {
    const { client } = useStore();
    const { currency, balance, is_logged_in } = client;
    const { submitForm, setFieldValue, values, isValid, validateForm } = useFormikContext<TFormValues>();
    const { quick_strategy, run_panel, load_modal } = useDBotStore();
    const {
        toggleStopBotDialog,
        setLossThresholdWarningData,
        selected_strategy,
        loss_threshold_warning_data,
        onSubmit,
    } = quick_strategy;

    // Build a complete workspace for the Matches Frequency Bulk strategy
    const buildMatchesFrequencyBulkWorkspace = () => {
        // This XML builds a full bot using standard wrappers and blocks we added (Digit Frequency + Bulk)
        const xml = `
<xml xmlns="http://www.w3.org/1999/xhtml" collection="false" is_dbot="true">
  <variables>
    <variable id="top_digits">top_digits</variable>
  </variables>
  <block type="trade_definition" x="0" y="0">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market">
        <next>
          <block type="trade_definition_tradetype">
            <field name="TRADETYPECAT_LIST">matchesdiffers</field>
            <next>
              <block type="trade_definition_contracttype">
                <field name="TYPE_LIST">DIGITMATCH</field>
                <next>
                  <block type="trade_definition_candleinterval">
                    <field name="CANDLEINTERVAL_LIST">60</field>
                    <next>
                      <block type="trade_definition_restartbuysell">
                        <field name="TIME_MACHINE_ENABLED">FALSE</field>
                        <next>
                          <block type="trade_definition_restartonerror">
                            <field name="RESTARTONERROR">TRUE</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="SUBMARKET">
      <block type="trade_definition_tradeoptions">
        <mutation has_first_barrier="false" has_second_barrier="false" has_prediction="true"></mutation>
        <field name="DURATIONTYPE_LIST">t</field>
        <field name="CURRENCY_LIST">USD</field>
        <value name="DURATION">
          <shadow type="math_number_positive">
            <field name="NUM">5</field>
          </shadow>
        </value>
        <value name="AMOUNT">
          <shadow type="math_number_positive">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="PREDICTION">
          <shadow type="math_number_positive">
            <field name="NUM">0</field>
          </shadow>
        </value>
      </block>
    </statement>
  </block>
  <block type="tick_analysis" x="0" y="520">
    <statement name="TICKANALYSIS_STACK">
      <block type="variables_set">
        <field name="VAR" id="top_digits">top_digits</field>
        <value name="VALUE">
          <block type="digit_frequency">
            <value name="ENTRY_COUNT">
              <shadow type="math_number_positive">
                <field name="NUM">30</field>
              </shadow>
            </value>
            <field name="TOP_N">7</field>
            <field name="ORDER">DESC</field>
          </block>
        </value>
        <next>
          <block type="notify">
            <field name="NOTIFICATION_TYPE">info</field>
            <field name="NOTIFICATION_SOUND">silent</field>
            <value name="MESSAGE">
              <block type="text_join">
                <mutation items="5"></mutation>
                <value name="ADD0">
                  <block type="text">
                    <field name="TEXT">Top: </field>
                  </block>
                </value>
                <value name="ADD1">
                  <block type="text">
                    <field name="TEXT"> </field>
                  </block>
                </value>
                <value name="ADD2">
                  <block type="text">
                    <field name="TEXT"> </field>
                  </block>
                </value>
                <value name="ADD3">
                  <block type="text">
                    <field name="TEXT"> | Last: </field>
                  </block>
                </value>
                <value name="ADD4">
                  <block type="last_digit"></block>
                </value>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="before_purchase" x="0" y="776">
    <statement name="BEFOREPURCHASE_STACK">
      <block type="variables_set">
        <field name="VAR" id="top_digits">top_digits</field>
        <value name="VALUE">
          <block type="digit_frequency">
            <value name="ENTRY_COUNT">
              <shadow type="math_number_positive">
                <field name="NUM">30</field>
              </shadow>
            </value>
            <field name="TOP_N">7</field>
            <field name="ORDER">DESC</field>
          </block>
        </value>
        <next>
          <block type="purchase">
            <field name="PURCHASE_LIST">DIGITMATCH</field>
            <field name="BULK_TOGGLE">ON</field>
            <value name="DIGIT_LIST">
              <block type="variables_get">
                <field name="VAR" id="top_digits">top_digits</field>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="during_purchase" x="720" y="0">
    <statement name="DURING_PURCHASE_STACK">
      <block type="controls_if">
        <value name="IF0">
          <block type="check_sell"></block>
        </value>
      </block>
    </statement>
  </block>
  <block type="after_purchase" x="720" y="248">
    <statement name="AFTERPURCHASE_STACK">
      <block type="trade_again"></block>
    </statement>
  </block>
</xml>`;
        load_modal.onLoadXml(xml);
    };

    const handleSubmit = async () => {
        const loss_amount = Number(values?.loss ?? 0);
        const profit_threshold = Number(values?.profit ?? 0);
        const stored_dont_show_warning_value = localStorage?.getItem('qs-dont-show-loss-threshold-warning');
        const dont_show_warning = JSON.parse(stored_dont_show_warning_value ?? 'false');
        if (
            !loss_threshold_warning_data.already_shown &&
            (loss_amount > 0.5 * Number(balance ?? 0) || loss_amount > 2 * profit_threshold) &&
            is_logged_in &&
            !dont_show_warning
        ) {
            setLossThresholdWarningData({
                show: true,
                loss_amount,
                currency,
                already_shown: true,
            });
        } else {
            proceedFormSubmission();
        }
    };

    const proceedFormSubmission = async () => {
        if (run_panel.is_running) {
            await setFieldValue('action', 'EDIT');
            validateForm();
            submitForm();
            toggleStopBotDialog();
            rudderStackSendQsRunStrategyEvent({
                form_values: values,
                selected_strategy,
            });
        } else {
            await setFieldValue('action', 'RUN');
            validateForm();
            submitForm().then((form_data: TFormValues | void) => {
                if (isValid && form_data) {
                    rudderStackSendQsRunStrategyEvent({
                        form_values: values,
                        selected_strategy,
                    });
                    // If user picked our new strategy, build a complete workspace using Digit Frequency + Bulk
                    if (selected_strategy === 'MATCHES_FREQUENCY_BULK') {
                        buildMatchesFrequencyBulkWorkspace();
                    }
                    onSubmit(form_data);
                }
            });
        }
    };

    return { handleSubmit, proceedFormSubmission };
};

export default useQsSubmitHandler;
