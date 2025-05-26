**This file will guide you through the process of seeding stock prices into the database with our scripts**


We use **`Alpha Vantage`** api to fetch the stock price data with the input is stock symbol, such as `AAPL` (Apple Inc). This function will access to the database and insert directly to the `stockPrices` table.

For more details, look up to [Apha Vantage](https://www.alphavantage.co/documentation/)


Before coming to production (get the database online somewhere) we will use this function to add some real stock prices value, in order to plot/draw some historical stock prices chart.

The `stock_fetcher.py` script is designed to fetch stock prices and update the database with the latest information. The `StockManager.js` file is the interface to use `stock_fetcher.py` script in the backend, allowing you to choose stocks sympol, time duration to fetch.

To run the script, you need to have Python installed on your machine along with the required Python libraries for the `stock_fetcher.py` to work.

Change to the directly where the `stock_fetcher.py` file is located, which is `app/backend/src/utils/seedStockPrice/`.

```bash
cd app/backend/src/utils/seedStockPrice/
```
Then activate your Python virtual environment and install the required libraries.

- With Linux

```bash
# Activate python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install pip tool if you haven't already
sudo pacman -Syu base-devel python-pip # With Arch-based
# sudo apt update && sudo apt upgrade -y && sudo apt install build-essential python3-pip  # With Debian-based, use this command instead
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt # Install the needed library
```

- With Windows

```shell
python -m venv venv
.\venv\Scripts\activate.bat # If execute in CMD
# .\venv\Scripts\activate.ps1 # If execute in PowerShell

# Install pip tool if you haven't already
python -m ensurepip --upgrade
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt # Install the needed library
```

After successfully installing the dependencies without any errors (in case of errors, mostly it will be Python version incompatible with the libraries, you can try to install each library manually without using `requirements.txt`), you can choose to run the Python script directly or use the `stockManager.js` interface for a more user-friendly experience.


Incase you want to run the script directly, there will be some parameters you can specify when running the script as follows:

```bash
#Fetch data for Apple for the past 30 days (default range)
python stock_fetcher.py AAPL

#Fetch data for Google with custom date range
python stock_fetcher.py GOOGL --start 2023-01-01 --end 2023-12-31

#If the stock is already exist in the database:
python stock_fetcher.py AAPL --update-info
```

In case you want to use the `stockManager.js` interface, you need to run the script in the `app/backend/` directory, so that it can access to the `.env` file and the `node_modules` folder.

```bash
cd app/backend/
```
> [!IMPORTANT]
> You will need to move to EXACTLY to this location to run the script, since:

- The `stockManager.js` needs to be run in a place where it can see the `node_modules` folder, which is located in the `app/backend/` directory.

- In the source, of the `stock_fetcher.py` file, we defined something like this:

```python
#Define the root directory - for loading .env file
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
```

Which will naviate to the root directory of the project compare to the current location of terminal path running the script. So in case you change to location of running the script, you will need to change the `Path` in the `stock_fetcher.py` file accordingly. Otherwise this will show error:

```plaintext
PS C:\Users\Chu Trung Anh\Desktop\Project\Product\Stock-Trading-Platform\app\backend\src\utils> cd .\seedStockPrice  
node:internal/modules/cjs/loader:1228
  throw err;
  ^
Error: Cannot find module 'C:\Users\Chu Trung Anh\Desktop\Project\Product\Stock-Trading-Platform\app\backend\src\utils\seedStockPrice\stock'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1225:15)
    at Function._load (node:internal/modules/cjs/loader:1055:27)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:170:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.14.0
```

Or even when specify the location of scripts:

```plaintext
PS C:\Users\Chu Trung Anh\Desktop\Project\Product\Stock-Trading-Platform\app\backend\src\utils> node .\seedStockPrice\stockManager.js 
[module_job] Database is running on port: undefined
[module_job] PgAdmin is running on port: undefined
Enter stock symbol (e.g., AAPL): 
```
See the script still works, but the database and PgAdmin port is `undefined`, which means the script cannot access to the `.env` file to get the port number. So one again, make sure you run the script in the correct location as described above.



Then run the script with the following command:

```bash
node src/utils/seedStockPrice/stockManager.js
```

It will require you to enter the stock symbol, such as AAPL. If the stock is already exist in the database, it will ask for permisson to update the stock's information and also fetch its prices. The value range will be for 30 days by default, you can modified it yourself by enter the specific start date and end date. If the stock does not exist in the database, it will add the stock and the prices.

**Demo:**

![Demo Fetch Stock Prices](../../../../../docs/images/FetchPrice.gif)
