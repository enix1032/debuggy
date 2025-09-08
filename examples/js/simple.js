import '@en32/debuggy/global';
import { inlineString } from '@en32/debuggy/utils'

// Simple logging
debuggy('Hello')('Hello World');

// Automatic label from variable name
const data = {
  name: 'John',
  age: 30,
};
debuggy()(data);

// Displaying multiple arguments
const otherData = {
  name: 'Jane',
  age: 25,
};
debuggy('Debug Multiple')(data, otherData);

// Displaying objects as a table (%t)
debuggy('Debug %t')(data);
debuggy('Debug %t')(data, otherData);

// Displaying objects as JSON (%j)
debuggy('Debug %j')(data);

// Grouping logs with different formats
debuggy('Debug Group', ['Group 1 %t', 'Group 2 %j'])(data, otherData);

// Combinations of formatting
debuggy('Debug %t %j')(data, otherData);

// Using custom colors
debuggy('<hy>Colored Log')(data);
debuggy('<hBy>Colored Log with Background')(data);

// Creating a shortcut

// This works, but the output line remains the same. Not recommended. Can be used if necessary.
const debug = debuggy('Debug: <yh>always line 42<s>');
debug('debug here...');
debug('here...');
debug('and here...');

// Solution #1 (Slight issue in BunJS runtime display)
const warn = debuggy.label('<hYb>WARNING<s>');
warn(data);

const err = debuggy.label('<rh>ERROR<s>');
err(data);

// Solution #2
const debug2 = debuggy
  .preset('log', '<bYh>Log Data<s>')
  .preset('info', '<yGh>Info Data<s>', 'myCustom');

debug2.log({ id: 1, message: 'Hello' });
debug2.info({ id: 2, message: 'World' });

// Example of a long SQL query string. `inlineString()` is a simple helper, do not expect too much.

const sql = `WITH monthly_sales AS (
    SELECT 
        strftime('%Y-%m', o.order_date) AS month,
        u.id AS user_id,
        u.name AS customer_name,
        SUM(oi.quantity * p.price) AS total_spent,
        COUNT(DISTINCT o.id) AS total_orders
    FROM orders o
    JOIN users u ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status = 'completed'
    GROUP BY month, u.id
),
top_customers AS (
    SELECT 
        month,
        user_id,
        customer_name,
        total_spent,
        RANK() OVER (PARTITION BY month ORDER BY total_spent DESC) AS rank
    FROM monthly_sales
)
SELECT 
    tc.month,
    tc.customer_name,
    tc.total_spent,
    tc.rank,
    (
        SELECT GROUP_CONCAT(c.name, ', ')
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN categories c ON c.id = p.category_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = tc.user_id 
          AND strftime('%Y-%m', o.order_date) = tc.month
    ) AS purchased_categories
FROM top_customers tc
WHERE tc.rank <= 3
ORDER BY tc.month DESC, tc.rank ASC;
`

debuggy('[SQL] SQL Query')(inlineString(sql, { maxLength: 100 }))
