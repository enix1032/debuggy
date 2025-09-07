import { inlineSQL } from '@en32/debuggy/utils'
import '@en32/debuggy/global';

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
const warn = debuggy.set('<hYb>WARNING<s>');
warn('%t', data);

const err = debuggy.set('<rh>ERROR<s>');
err(data);

// SQL

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

debuggy('[SQL] SQL Query')(inlineSQL(sql))

