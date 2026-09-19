====================================================================
             BANK DATABASE – ACID PROPERTIES & ISOLATION
====================================================================

SQL PRACTICAL / LAB EXERCISE

TOPICS COVERED:

1. Database Creation
2. Table Creation
3. Data Insertion
4. Transactions
5. COMMIT
6. ROLLBACK
7. SAVEPOINT
8. ACID Properties
9. READ UNCOMMITTED
10. READ COMMITTED
11. REPEATABLE READ
12. SERIALIZABLE
13. Dirty Read
14. Non-Repeatable Read
15. Phantom Read
16. Concurrent Transactions
17. Practice Questions


====================================================================
1. CREATE DATABASE
====================================================================

CREATE DATABASE Bank_ACID_DB;

USE Bank_ACID_DB;


====================================================================
2. CREATE CUSTOMER TABLE
====================================================================

CREATE TABLE Customer (
    Customer_ID INT PRIMARY KEY,
    Customer_Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15),
    City VARCHAR(50)
);


====================================================================
3. CREATE ACCOUNT TABLE
====================================================================

CREATE TABLE Account (
    Account_No INT PRIMARY KEY,
    Customer_ID INT,
    Account_Type VARCHAR(20),
    Balance DECIMAL(12,2),
    Branch VARCHAR(50),

    FOREIGN KEY (Customer_ID)
    REFERENCES Customer(Customer_ID)
);


====================================================================
4. CREATE TRANSACTION TABLE
====================================================================

CREATE TABLE Bank_Transaction (
    Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
    Account_No INT,
    Transaction_Type VARCHAR(20),
    Amount DECIMAL(12,2),
    Transaction_Date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (Account_No)
    REFERENCES Account(Account_No)
);


====================================================================
5. INSERT CUSTOMER DATA
====================================================================

INSERT INTO Customer
(Customer_ID, Customer_Name, Phone, City)
VALUES
(101, 'Ravi Kumar', '9876543210', 'Hyderabad'),

(102, 'Priya Sharma', '9876543211', 'Vijayawada'),

(103, 'Arjun Reddy', '9876543212', 'Bangalore'),

(104, 'Sneha Rao', '9876543213', 'Chennai'),

(105, 'Kiran Kumar', '9876543214', 'Hyderabad');


====================================================================
6. INSERT ACCOUNT DATA
====================================================================

INSERT INTO Account
(Account_No, Customer_ID, Account_Type, Balance, Branch)
VALUES
(10001, 101, 'Savings', 50000, 'Hyderabad'),

(10002, 102, 'Savings', 75000, 'Vijayawada'),

(10003, 103, 'Current', 120000, 'Bangalore'),

(10004, 104, 'Savings', 45000, 'Chennai'),

(10005, 105, 'Current', 90000, 'Hyderabad');


====================================================================
7. INSERT BANK TRANSACTION DATA
====================================================================

INSERT INTO Bank_Transaction
(Account_No, Transaction_Type, Amount)
VALUES
(10001, 'DEPOSIT', 10000),

(10002, 'DEPOSIT', 15000),

(10003, 'WITHDRAW', 20000),

(10004, 'DEPOSIT', 5000),

(10005, 'WITHDRAW', 10000);


====================================================================
8. DISPLAY DATA
====================================================================

SELECT * FROM Customer;

SELECT * FROM Account;

SELECT * FROM Bank_Transaction;


====================================================================
                  PART A – TRANSACTIONS
====================================================================


------------------------------------------------------------
9. START A TRANSACTION
------------------------------------------------------------

START TRANSACTION;


------------------------------------------------------------
10. DEPOSIT MONEY
------------------------------------------------------------

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;


------------------------------------------------------------
11. CHECK BALANCE
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No = 10001;


------------------------------------------------------------
12. COMMIT TRANSACTION
------------------------------------------------------------

COMMIT;


------------------------------------------------------------
13. CHECK BALANCE AFTER COMMIT
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No = 10001;


====================================================================
                  PART B – ROLLBACK
====================================================================


------------------------------------------------------------
14. START TRANSACTION
------------------------------------------------------------

START TRANSACTION;


------------------------------------------------------------
15. WITHDRAW MONEY
------------------------------------------------------------

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;


------------------------------------------------------------
16. CHECK BALANCE
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No = 10001;


------------------------------------------------------------
17. ROLLBACK
------------------------------------------------------------

ROLLBACK;


------------------------------------------------------------
18. CHECK BALANCE AFTER ROLLBACK
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No = 10001;


EXPECTED RESULT:

The withdrawal is cancelled and the original balance is
restored.


====================================================================
                  PART C – SAVEPOINT
====================================================================


------------------------------------------------------------
19. START TRANSACTION
------------------------------------------------------------

START TRANSACTION;


------------------------------------------------------------
20. FIRST UPDATE
------------------------------------------------------------

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;


------------------------------------------------------------
21. CREATE SAVEPOINT
------------------------------------------------------------

SAVEPOINT Deposit1;


------------------------------------------------------------
22. SECOND UPDATE
------------------------------------------------------------

UPDATE Account
SET Balance = Balance - 3000
WHERE Account_No = 10002;


------------------------------------------------------------
23. CREATE SECOND SAVEPOINT
------------------------------------------------------------

SAVEPOINT Withdrawal1;


------------------------------------------------------------
24. THIRD UPDATE
------------------------------------------------------------

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10003;


------------------------------------------------------------
25. ROLLBACK TO SAVEPOINT
------------------------------------------------------------

ROLLBACK TO SAVEPOINT Withdrawal1;


------------------------------------------------------------
26. COMMIT
------------------------------------------------------------

COMMIT;


------------------------------------------------------------
27. CHECK ACCOUNTS
------------------------------------------------------------

SELECT *
FROM Account;


====================================================================
                  PART D – BANK TRANSFER
====================================================================


------------------------------------------------------------
28. TRANSFER MONEY
------------------------------------------------------------

START TRANSACTION;


------------------------------------------------------------
29. DEDUCT FROM SENDER
------------------------------------------------------------

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;


------------------------------------------------------------
30. ADD TO RECEIVER
------------------------------------------------------------

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10002;


------------------------------------------------------------
31. CHECK BOTH ACCOUNTS
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No IN (10001,10002);


------------------------------------------------------------
32. COMMIT TRANSFER
------------------------------------------------------------

COMMIT;


------------------------------------------------------------
33. FINAL BALANCES
------------------------------------------------------------

SELECT
    Account_No,
    Balance
FROM Account
WHERE Account_No IN (10001,10002);


====================================================================
             PART E – TRANSFER USING ROLLBACK
====================================================================


------------------------------------------------------------
34. START TRANSACTION
------------------------------------------------------------

START TRANSACTION;


------------------------------------------------------------
35. DEDUCT MONEY
------------------------------------------------------------

UPDATE Account
SET Balance = Balance - 20000
WHERE Account_No = 10001;


------------------------------------------------------------
36. ADD MONEY
------------------------------------------------------------

UPDATE Account
SET Balance = Balance + 20000
WHERE Account_No = 10002;


------------------------------------------------------------
37. CANCEL TRANSACTION
------------------------------------------------------------

ROLLBACK;


------------------------------------------------------------
38. CHECK BALANCES
------------------------------------------------------------

SELECT *
FROM Account
WHERE Account_No IN (10001,10002);


EXPECTED RESULT:

Both account balances return to their original values.


====================================================================
                     PART F – ACID
====================================================================


ACID stands for:

A – ATOMICITY
C – CONSISTENCY
I – ISOLATION
D – DURABILITY


------------------------------------------------------------
39. ATOMICITY
------------------------------------------------------------

Atomicity means:

A transaction is treated as one complete unit.

Either ALL operations are completed or NONE of them are
completed.


BANK EXAMPLE:

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10002;

COMMIT;


If an error occurs before COMMIT:

ROLLBACK;


RESULT:

Both operations are cancelled.


------------------------------------------------------------
40. CONSISTENCY
------------------------------------------------------------

Consistency means:

A transaction must take the database from one valid state
to another valid state.

Example:

Before transfer:

Account 10001 = 50000
Account 10002 = 75000

Total = 125000


After transferring 10000:

Account 10001 = 40000
Account 10002 = 85000

Total = 125000


The total money remains consistent.


------------------------------------------------------------
41. ISOLATION
------------------------------------------------------------

Isolation means:

Multiple transactions executing at the same time should not
incorrectly interfere with each other.


Example:

Transaction T1:
Transfer money.

Transaction T2:
Read account balance.

The database controls how much of T1 is visible to T2.


------------------------------------------------------------
42. DURABILITY
------------------------------------------------------------

Durability means:

Once a transaction is successfully committed, its changes
remain stored even if a system failure occurs.


Example:

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;

COMMIT;


After COMMIT, the updated balance is permanently recorded.


====================================================================
              PART G – TRANSACTION ISOLATION LEVELS
====================================================================


The standard isolation levels are:

1. READ UNCOMMITTED
2. READ COMMITTED
3. REPEATABLE READ
4. SERIALIZABLE


====================================================================
             43. CHECK CURRENT ISOLATION LEVEL
====================================================================

SELECT @@SESSION.transaction_isolation;


OR:

SELECT @@GLOBAL.transaction_isolation;


====================================================================
             44. READ UNCOMMITTED
====================================================================

SET SESSION TRANSACTION ISOLATION LEVEL
READ UNCOMMITTED;


START TRANSACTION;


SELECT *
FROM Account
WHERE Account_No = 10001;


COMMIT;


MEANING:

A transaction may read data modified by another transaction
before that transaction commits.

Possible problem:

DIRTY READ


====================================================================
             45. READ COMMITTED
====================================================================

SET SESSION TRANSACTION ISOLATION LEVEL
READ COMMITTED;


START TRANSACTION;


SELECT *
FROM Account
WHERE Account_No = 10001;


COMMIT;


MEANING:

A transaction can read only committed data.

DIRTY READ is prevented.


====================================================================
             46. REPEATABLE READ
====================================================================

SET SESSION TRANSACTION ISOLATION LEVEL
REPEATABLE READ;


START TRANSACTION;


SELECT *
FROM Account
WHERE Account_No = 10001;


COMMIT;


MEANING:

Repeated reads within the same transaction return a consistent
result under the database's concurrency rules.

In MySQL InnoDB, REPEATABLE READ is the default isolation
level.


====================================================================
             47. SERIALIZABLE
====================================================================

SET SESSION TRANSACTION ISOLATION LEVEL
SERIALIZABLE;


START TRANSACTION;


SELECT *
FROM Account
WHERE Account_No = 10001;


COMMIT;


MEANING:

Transactions are executed with the strongest standard
isolation behavior.

Concurrency is reduced, but transaction anomalies are
strongly restricted.


====================================================================
          PART H – DIRTY READ EXPERIMENT
====================================================================


IMPORTANT:

Use TWO MySQL sessions/windows.

SESSION 1:

SET SESSION TRANSACTION ISOLATION LEVEL
READ UNCOMMITTED;

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 20000
WHERE Account_No = 10001;


DO NOT COMMIT YET.


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

SET SESSION TRANSACTION ISOLATION LEVEL
READ UNCOMMITTED;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;


SESSION 2 may see the uncommitted change under
READ UNCOMMITTED.


------------------------------------------------------------
SESSION 1:
------------------------------------------------------------

ROLLBACK;


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

SELECT Balance
FROM Account
WHERE Account_No = 10001;

COMMIT;


CONCEPT:

This demonstrates the possibility of a DIRTY READ.


====================================================================
        PART I – READ COMMITTED EXPERIMENT
====================================================================


Use TWO database sessions.

SESSION 1:

SET SESSION TRANSACTION ISOLATION LEVEL
READ COMMITTED;

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10001;


DO NOT COMMIT.


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

SET SESSION TRANSACTION ISOLATION LEVEL
READ COMMITTED;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;


SESSION 2 does not read the uncommitted change.


------------------------------------------------------------
SESSION 1:
------------------------------------------------------------

COMMIT;


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

SELECT Balance
FROM Account
WHERE Account_No = 10001;

COMMIT;


CONCEPT:

READ COMMITTED prevents dirty reads.


====================================================================
        PART J – REPEATABLE READ EXPERIMENT
====================================================================


SESSION 1:

SET SESSION TRANSACTION ISOLATION LEVEL
REPEATABLE READ;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;

COMMIT;


------------------------------------------------------------
SESSION 1:
------------------------------------------------------------

SELECT Balance
FROM Account
WHERE Account_No = 10001;


COMMIT;


CONCEPT:

Under MySQL InnoDB's REPEATABLE READ, consistent reads
within the transaction normally see the same snapshot.


====================================================================
             PART K – SERIALIZABLE EXPERIMENT
====================================================================


SESSION 1:

SET SESSION TRANSACTION ISOLATION LEVEL
SERIALIZABLE;

START TRANSACTION;

SELECT *
FROM Account
WHERE Account_No = 10001;


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

SET SESSION TRANSACTION ISOLATION LEVEL
SERIALIZABLE;

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;


The second transaction may wait until the first transaction
releases the required lock.


------------------------------------------------------------
SESSION 1:
------------------------------------------------------------

COMMIT;


------------------------------------------------------------
SESSION 2:
------------------------------------------------------------

COMMIT;


CONCEPT:

SERIALIZABLE provides the strongest standard isolation level
and may reduce concurrency.


====================================================================
              PART L – TRANSACTION COMMANDS
====================================================================


START TRANSACTION;

BEGIN;

COMMIT;

ROLLBACK;

SAVEPOINT Savepoint_Name;

ROLLBACK TO SAVEPOINT Savepoint_Name;

RELEASE SAVEPOINT Savepoint_Name;


====================================================================
              PART M – BANK TRANSACTION EXAMPLES
====================================================================


------------------------------------------------------------
48. DEPOSIT TRANSACTION
------------------------------------------------------------

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;

COMMIT;


------------------------------------------------------------
49. WITHDRAWAL TRANSACTION
------------------------------------------------------------

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 5000
WHERE Account_No = 10001;

COMMIT;


------------------------------------------------------------
50. CANCEL WITHDRAWAL
------------------------------------------------------------

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;

ROLLBACK;


------------------------------------------------------------
51. TRANSFER WITH SAVEPOINT
------------------------------------------------------------

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;

SAVEPOINT AfterDebit;

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10002;

COMMIT;


====================================================================
              PART N – PRACTICE QUESTIONS
====================================================================


QUESTION 1:
Create a transaction that deposits Rs. 5000 into account
10001 and commit the transaction.


------------------------------------------------------------

QUESTION 2:
Create a transaction that withdraws Rs. 3000 from account
10002 and commit the transaction.


------------------------------------------------------------

QUESTION 3:
Create a transaction that withdraws Rs. 10000 and then
ROLLBACK the transaction.


------------------------------------------------------------

QUESTION 4:
Transfer Rs. 15000 from account 10001 to account 10002
using a transaction.


Requirements:

1. START TRANSACTION
2. Deduct from sender
3. Add to receiver
4. COMMIT


------------------------------------------------------------

QUESTION 5:
Transfer Rs. 20000 from account 10001 to account 10003.

Use SAVEPOINT after deducting the amount from the sender.


------------------------------------------------------------

QUESTION 6:
Create a transaction with three account updates and use
ROLLBACK TO SAVEPOINT to cancel only the third update.


------------------------------------------------------------

QUESTION 7:
Demonstrate ATOMICITY using a bank money transfer.


------------------------------------------------------------

QUESTION 8:
Demonstrate CONSISTENCY by verifying that the total money
before and after a transfer remains unchanged.


------------------------------------------------------------

QUESTION 9:
Demonstrate DURABILITY by committing a transaction and
checking the data after reconnecting to the database.


------------------------------------------------------------

QUESTION 10:
Set the transaction isolation level to READ UNCOMMITTED
and demonstrate a dirty read using two sessions.


------------------------------------------------------------

QUESTION 11:
Set the transaction isolation level to READ COMMITTED and
demonstrate that an uncommitted update cannot be read.


------------------------------------------------------------

QUESTION 12:
Set the isolation level to REPEATABLE READ and demonstrate
consistent reads using two sessions.


------------------------------------------------------------

QUESTION 13:
Set the isolation level to SERIALIZABLE and demonstrate
concurrent transaction behavior using two sessions.


------------------------------------------------------------

QUESTION 14:
Compare the following isolation levels:

READ UNCOMMITTED
READ COMMITTED
REPEATABLE READ
SERIALIZABLE


------------------------------------------------------------

QUESTION 15:
Identify which anomaly can occur in each isolation level:

Dirty Read
Non-Repeatable Read
Phantom Read


------------------------------------------------------------

QUESTION 16:
Create a transaction for transferring money where the
receiver account does not exist.

The transaction should be rolled back.


------------------------------------------------------------

QUESTION 17:
Create a transaction where the sender has insufficient
balance.

The transaction should not be committed.


------------------------------------------------------------

QUESTION 18:
Use SAVEPOINT to perform:

1. Deposit Rs. 5000 into Account 10001.
2. Create SAVEPOINT.
3. Withdraw Rs. 2000 from Account 10002.
4. Roll back to SAVEPOINT.
5. Commit.


------------------------------------------------------------

QUESTION 19:
Write SQL statements to display the current transaction
isolation level.


------------------------------------------------------------

QUESTION 20:
Write SQL statements to change the session isolation level
to SERIALIZABLE.


====================================================================
                 PART O – EXAM PRACTICE
====================================================================


1. Define ACID properties.

2. Explain Atomicity with a banking example.

3. Explain Consistency with a banking example.

4. Explain Isolation with a banking example.

5. Explain Durability with a banking example.

6. What is a transaction?

7. What is COMMIT?

8. What is ROLLBACK?

9. What is SAVEPOINT?

10. What is transaction isolation?

11. What is Dirty Read?

12. What is Non-Repeatable Read?

13. What is Phantom Read?

14. Explain READ UNCOMMITTED.

15. Explain READ COMMITTED.

16. Explain REPEATABLE READ.

17. Explain SERIALIZABLE.

18. Compare all four isolation levels.

19. Explain concurrency control.

20. Demonstrate a bank money transfer using ACID properties.


====================================================================
             PART P – QUICK REFERENCE TABLE
====================================================================


COMMAND                     PURPOSE
------------------------------------------------------------

START TRANSACTION            Starts a transaction

BEGIN                        Starts a transaction

COMMIT                       Permanently saves changes

ROLLBACK                     Cancels transaction changes

SAVEPOINT                    Creates a rollback point

ROLLBACK TO SAVEPOINT        Rolls back to a savepoint

RELEASE SAVEPOINT            Removes a savepoint

------------------------------------------------------------

ISOLATION LEVEL              MAIN IDEA
------------------------------------------------------------

READ UNCOMMITTED             Lowest isolation

READ COMMITTED               Reads committed data

REPEATABLE READ              Consistent repeated reads

SERIALIZABLE                 Strongest standard isolation


====================================================================
                     END OF PRACTICAL
====================================================================