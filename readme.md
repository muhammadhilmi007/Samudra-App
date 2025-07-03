# Samudra App - Local Environment Setup

Welcome to Samudra App! This guide will walk you through the steps to set up Samudra App in your local environment. Samudra App is an Admin Dashboard built on Express.js and MongoDB, designed to help you manage your data and perform various administrative tasks efficiently.

## Prerequisites

Before you begin the installation process, ensure you have the following prerequisites installed and running on your computer:

1. **Node.js and NPM**: Samudra App is built on Express.js, which requires Node.js and NPM (Node Package Manager). If you don't have Node.js installed, you can download it from the official website: [https://nodejs.org](https://nodejs.org). The installation will also include NPM.

2. **MongoDB**: Samudra App uses MongoDB as its database. Ensure that you have **MongoDB installed** and running on your computer. You can download MongoDB from the official website: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). If you prefer a visual interface to interact with the database, you can also install MongoDB Compass.

## Installation

1. Clone the Repository:
    ```
    git clone <repository_url>
    cd Samudra App
    ```

2. Install Dependencies:
    ```
    npm install
    ```

3. Configure Database Credentials:
   Open the `.env` file in the root directory of your Samudra App application using a text editor.
   Set the following values according to your MongoDB setup:
    ```
    DATABASE_HOST=127.0.0.1
    DATABASE_PORT=27017
    DATABASE_NAME=Samudra App
    ```
  Replace the values with the appropriate database host, port, and name.

4. Database Migration:
  Before running the application, you may need to perform database migrations to create necessary tables or collections.
  Samudra App uses Mongoose as the database object modeling tool, which handles migrations for MongoDB. For more details on how to perform migrations using Mongoose, visit [https://mongoosejs.com/docs/documents.html](https://mongoosejs.com/docs/documents.html).

5. Start MongoDB:
   Ensure that MongoDB is running by executing the following command:
    ```
    Mongodb Start
    ```

6. Start the Application:
   To run the Samudra App Admin Dashboard in your local environment, execute the following command:
    ```
    npm start
    ```
    Once the server starts successfully, you can access the application by navigating to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.When you run npm start, it will automatically compile SCSS to CSS and locate the compiled CSS at public/css/all-custom.css. Additionally, it will watch for any changes in your SCSS files and automatically recompile the CSS every time you make changes.

    This command runs the application using "nodemon," which automatically restarts the server on file changes.


7. Compiling SCSS
   To compile SCSS files into CSS, use the following command:
    ```
    npm run compile:scss
    ```
    This command compiles "public/scss/custom.scss" to "public/css/all-custom.css" using the "sass" compiler.

8. Watching SCSS
   To automatically watch for changes in SCSS files and compile them into CSS, use the following command:
    ```
    npm run watch:scss
    ```
    Any changes in "public/scss" will trigger automatic compilation to "public/css."

9. Right-to-Left (RTL) Support
   To generate a right-to-left (RTL) version of the CSS, use the following command:
    ```
    npm run rtl
    ```
    The command converts "public/css/all-custom.css" to "public/css/all-custom.rtl.css" using "rtlcss."

## Usage

With Samudra App up and running on your local machine, you can now explore and manage your data using the Admin Dashboard. The dashboard provides an intuitive interface to perform various administrative tasks efficiently.

## Contribution

If you encounter any issues or would like to contribute to Samudra App, please feel free to submit issues or pull requests to the GitHub repository. We welcome and appreciate any contributions to make Samudra App even better!

## License

Samudra App is open-source software released under the [MIT License](LICENSE). You are free to use, modify, and distribute the software as per the terms mentioned in the License.

---

Thank you for choosing Samudra App! If you have any questions or need further assistance, please don't hesitate to reach out to our support team or consult the documentation. Happy dashboarding!
