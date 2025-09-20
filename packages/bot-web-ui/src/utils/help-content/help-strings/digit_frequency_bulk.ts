export default {
    digit_frequency: [
        {
            type: 'text',
            text: 'Digit Frequency returns a ranked list of digits (0–9) based on how often the last digit appears in the most recent N ticks. Use it to pick the most/least frequent digits dynamically.'
        },
        {
            type: 'text',
            text: 'Parameters:'
        },
        {
            type: 'text',
            text: '- entry_count: number of recent ticks to analyze (default 30)\n- top_n: how many digits to return (5/6/7; default 7)\n- order: DESC (most frequent first; default) or ASC (least frequent first)'
        },
        {
            type: 'text',
            text: 'Returns: Array of digits, e.g., [8,1,3,4,6,7,5]. Place inside Tick Analysis to recompute on every tick.'
        },
        {
            type: 'text',
            text: 'Example: Compute top 7 digits from last 30 ticks in DESC order, store in variable top_digits, and feed into Bulk Purchase.'
        },
        {
            type: 'example',
            example_id: 'digit_frequency_bulk_example'
        }
    ],
    purchase_bulk: [
        {
            type: 'text',
            text: 'Bulk Purchase extends the Purchase block to submit sequential contracts for each digit in a provided Digit List. It reuses your current Trade Definition (market/symbol/type/duration).' 
        },
        {
            type: 'text',
            text: 'When Bulk is ON:'
        },
        {
            type: 'text',
            text: '- Digit List: Array of digits (e.g. from Digit Frequency).\n- Per-contract stake = Stake × number_of_digits (length of Digit List).\n- Each contract’s prediction is set to the corresponding digit.'
        },
        {
            type: 'text',
            text: 'When Bulk is OFF: behaves like the existing single-purchase block.'
        },
        {
            type: 'text',
            text: 'Place in Before Purchase. You can wire Digit Frequency → variables_set(top_digits) → Purchase(Bulk=ON, Digit List=top_digits).'
        },
        {
            type: 'example',
            example_id: 'digit_frequency_bulk_example'
        }
    ]
} as const;
