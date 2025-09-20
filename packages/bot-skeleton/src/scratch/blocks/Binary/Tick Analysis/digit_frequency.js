import { localize } from '@deriv/translations';
import { modifyContextMenu } from '../../../utils';

Blockly.Blocks.digit_frequency = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
    },
    definition() {
        return {
            message0: localize('Digit Frequency (last {{ n }} ticks, top {{ top_n }}, order {{ order }})', {
                n: '%1',
                top_n: '%2',
                order: '%3',
            }),
            args0: [
                {
                    type: 'input_value',
                    name: 'ENTRY_COUNT',
                    check: 'Number',
                },
                {
                    type: 'field_dropdown',
                    name: 'TOP_N',
                    options: [
                        [localize('5'), '5'],
                        [localize('6'), '6'],
                        [localize('7'), '7'],
                    ],
                },
                {
                    type: 'field_dropdown',
                    name: 'ORDER',
                    options: [
                        [localize('ASC'), 'ASC'],
                        [localize('DESC'), 'DESC'],
                    ],
                },
            ],
            output: 'Array',
            outputShape: Blockly.OUTPUT_SHAPE_ROUND,
            colour: Blockly.Colours.Base.colour,
            colourSecondary: Blockly.Colours.Base.colourSecondary,
            colourTertiary: Blockly.Colours.Base.colourTertiary,
            tooltip: localize(
                'Returns a ranked array of digits (0-9) by frequency from the last N ticks. Recomputes dynamically on every tick.'
            ),
            category: Blockly.Categories.Tick_Analysis,
        };
    },
    meta() {
        return {
            display_name: localize('Digit Frequency'),
            description: localize(
                'Computes the last-digit frequency over the most recent N ticks and returns the top-ranked digits.'
            ),
            // Map to help content group to enable in-UI helper
            help_group: 'digit_frequency_bulk',
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
};

Blockly.JavaScript.javascriptGenerator.forBlock.digit_frequency = block => {
    const entry_count =
        Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'ENTRY_COUNT',
            Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '30';
    const top_n = block.getFieldValue('TOP_N') || '7';
    const order = block.getFieldValue('ORDER') || 'DESC';

    const code = `Bot.getDigitFrequencyList({ entry_count: Number(${entry_count}), top_n: Number(${top_n}), order: '${order}' })`;
    return [code, Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC];
};