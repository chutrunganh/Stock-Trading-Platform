- [ ]: Use bycrypt to encrypt the password
- [ ]: Use JWT to authenticate the user
- [ ]: Fix the id of the user in the database, do not use simple increment id, use uuid instead
- [Thanh]: Defines Transactions logic: get the user transactions history, get all the transactions (admin), can consider to add undo/refund option, but not necessary. Consider the logic needed when deleted transaction. When create the transactions table, the transaction_type is defined as VARCHAR, can consider to change to ENUM but postgresql does not have this type.

