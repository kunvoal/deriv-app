### Architecture and general philosophy of this package

New additions:
- Digit Frequency reporter block (Binary > Tick Analysis)
  - Returns ranked digits based on last-digit frequency over N recent ticks; configurable top_n and order
  - Recomputes on every tick when used inside the Tick Analysis block
- Purchase block Bulk mode (Binary > Before Purchase)
  - Enables submitting sequential purchases for each digit in a provided list
  - Per-contract stake scales by the number of digits in the list

Examples are available under packages/bot-skeleton/examples/xml-examples/random/ to demonstrate configuration and wiring.
