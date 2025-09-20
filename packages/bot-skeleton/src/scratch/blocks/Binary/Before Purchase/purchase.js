import { localize } from '@deriv/translations';
import { getContractTypeOptions } from '../../../shared';
import { modifyContextMenu } from '../../../utils';

Blockly.Blocks.purchase = {
    init() {
        this.jsonInit(this.definition());

        // Ensure one of this type per statement-stack
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Purchase {{ contract_type }}', { contract_type: '%1' }),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PURCHASE_LIST',
                    options: [['', '']],
                },
            ],
            message1: localize('Bulk {{ bulk_toggle }}', { bulk_toggle: '%1' }),
            args1: [
                {
                    type: 'field_dropdown',
                    name: 'BULK_TOGGLE',
                    options: [
                        [localize('OFF'), 'OFF'],
                        [localize('ON'), 'ON'],
                    ],
                },
            ],
            message2: localize('Digit List: {{ list }}', { list: '%1' }),
            args2: [
                {
                    type: 'input_value',
                    name: 'DIGIT_LIST',
                    check: 'Array',
                },
            ],
            previousStatement: null,
            colour: Blockly.Colours.Special1.colour,
            colourSecondary: Blockly.Colours.Special1.colourSecondary,
            colourTertiary: Blockly.Colours.Special1.colourTertiary,
            tooltip: localize('This block purchases contract of a specified type. Enable Bulk to purchase sequentially for a list of digits.'),
            category: Blockly.Categories.Before_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Purchase'),
            description: localize(
                'Use this block to purchase the specific contract you want. You may add multiple Purchase blocks together with conditional blocks to define your purchase conditions. This block can only be used within the Purchase conditions block.'
            ),
            key_words: localize('buy'),
            // Map to help content group to enable in-UI helper
            help_group: 'digit_frequency_bulk',
        };
    },
    onchange(event) {
        if (!this.workspace || Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) {
            return;
        }

        if (event.type === Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) {
            this.populatePurchaseList(event);
            this.updateBulkUI();
        } else if (event.type === Blockly.Events.BLOCK_CHANGE) {
            if (event.name === 'TYPE_LIST' || event.name === 'TRADETYPE_LIST') {
                this.populatePurchaseList(event);
            }
            if (event.blockId === this.id && event.name === 'BULK_TOGGLE') {
                this.updateBulkUI();
            }
        } else if (event.type === Blockly.Events.BLOCK_DRAG && !event.isStart && event.blockId === this.id) {
            const purchase_type_list = this.getField('PURCHASE_LIST');
            const purchase_options = purchase_type_list.menuGenerator_; // eslint-disable-line

            if (purchase_options[0][0] === '') {
                this.populatePurchaseList(event);
            }
            this.updateBulkUI();
        }
    },
    updateBulkUI() {
        const bulk_toggle = this.getFieldValue('BULK_TOGGLE');
        const input = this.getInput('DIGIT_LIST');
        if (bulk_toggle === 'ON') {
            if (!input.connection.targetConnection) {
                // Provide a default shadow list if nothing is connected
                const shadow_block = this.workspace.newBlock('lists_create_with');
                shadow_block.setShadow(true);
                shadow_block.initSvg();
                shadow_block.renderEfficiently();
                input.connection.connect(shadow_block.outputConnection);
            }
        } else {
            if (input && input.connection && input.connection.targetBlock()) {
                const target = input.connection.targetBlock();
                if (target && target.isShadow()) {
                    target.dispose(true);
                } else {
                    input.connection.disconnect();
                }
            }
        }
    },
    populatePurchaseList(event) {
        const trade_definition_block = this.workspace.getTradeDefinitionBlock();

        if (trade_definition_block) {
            const trade_type_block = trade_definition_block.getChildByType('trade_definition_tradetype');
            const trade_type = trade_type_block.getFieldValue('TRADETYPE_LIST');
            const contract_type_block = trade_definition_block.getChildByType('trade_definition_contracttype');
            const contract_type = contract_type_block.getFieldValue('TYPE_LIST');
            const purchase_type_list = this.getField('PURCHASE_LIST');
            const purchase_type = purchase_type_list.getValue();
            const contract_type_options = getContractTypeOptions(contract_type, trade_type);

            purchase_type_list.updateOptions(contract_type_options, {
                default_value: purchase_type,
                event_group: event.group,
                should_pretend_empty: true,
            });
        }
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
    restricted_parents: ['before_purchase'],
};

Blockly.JavaScript.javascriptGenerator.forBlock.purchase = block => {
    const purchaseList = block.getFieldValue('PURCHASE_LIST');
    const bulk_toggle = block.getFieldValue('BULK_TOGGLE') || 'OFF';
    const digit_list_code =
        Blockly.JavaScript.javascriptGenerator.valueToCode(
            block,
            'DIGIT_LIST',
            Blockly.JavaScript.javascriptGenerator.ORDER_ATOMIC
        ) || '[]';

    if (bulk_toggle === 'ON') {
        const code = `Bot.setBulkPurchase(true, ${digit_list_code});\nBot.purchase('${purchaseList}');\n`;
        return code;
    }
    const code = `Bot.setBulkPurchase(false, []);\nBot.purchase('${purchaseList}');\n`;
    return code;
};
