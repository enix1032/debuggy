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

