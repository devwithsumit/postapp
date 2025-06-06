# Change Color of the Console logs
``` js  
//** Using ANSI espace codes
app.listen(3000, () => {
    // Green color for the message
    const greenColor = '\x1b[32m';
    // Blue color for the URL (often used for links)
    const yellowColor = '\x1b[34m';
    // Reset color to default (important!)
    const resetColor = '\x1b[0m';

    console.log(`${greenColor}Server live at: ${yellowColor}http://localhost:3000${resetColor}`);
});
//** Using chalk library
const chalk = require('chalk');

app.listen(3000, () => {
    console.log(chalk.green('Server live at: ') + chalk.blue('http://localhost:3000'));
    // Or even more fluently:
    console.log(`Server live at: ${chalk.blue('http://localhost:3000')}`);
});
```