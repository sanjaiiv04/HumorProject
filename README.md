# HumorProject

## Week - 1 Hello World
* Create a new GitHub repository.
* Clone that GitHub repository using IntelliJ
* Create a new NextJS app with your favorite CLI tool.
* Commit your changes to GitHub.
* Create a new project in Vercel and connect it to your new GitHub repository.
* Make sure your app is successfully deployed in Vercel.
* Turn off Vercel “deployment protection” so that you can view your page in Incognito Mode.
* Submit the commit-specific URL of your Vercel app in the “Submissions” section.

## Week - 2 Connecting the Database
* Continue from your existing GitHub repository. Use the same Next.js app you created in Assignment #1.
* Connect your app to Supabase. Store your Supabase URL and anon key in environment variables (do not hardcode them).
* Create a table of your choice and then fetch rows from the table.
* Render a list page. Display the rows returned from Supabase in a list, table, or card format.
* Commit and push your changes to GitHub. Deploy the changes to Vercel.
* Turn off Vercel “deployment protection” so that you can view your page in Incognito Mode.
* Submit the commit-specific URL of your Vercel app in the “Submissions” section.

## Weel - 3 Auth Week
* Create a “profiles” table and a auth.users trigger. Extend your app from assignment #2. Update it so that it protects a given route and shows a gated UI. Add a Profile section. You should create a “profiles” table in your Supabase. Rows to this table should get added when new users sign in to your application for the first time. You can do this using a “trigger” in SQL.
* In your “profiles” table, add a column for first name and for last name - you get to decide what to call these fields. Make sure these fields are nullable.
* Create your own Google OAuth client so that you can accept signups/logins using Google.
* After the user logs in, check to see if their first name and last name field is filled in. If it isn’t, prompt them to add their first name and last name. Feel free to ask them for more details if you want!
* Create a “Profile” section in your app that allows the user to change their first name, last name, and to upload a photo of themselves. Feel free to collect more data from your users if you want to.
* Then add a route of your choice that will only show if the user is logged in.
* Be sure that your redirect URI is /auth/callback in your application. Make sure you are redirecting to /auth/callback, not any other route with any other query parameters.
* Turn off Vercel “deployment protection” so that you can view your page in Incognito Mode.
* Submit the commit-specific URL of your Vercel app in the “Submissions” section.
* Do NOT store binary image data directly in your relational database.

## Week - 4 Caption rating app
* The key goal of this assignment is to practice mutating data, which means creating new rows in your database rather than just reading existing data. Specifically, when a user submits a vote, your app should insert a new row into a new table that records the user’s vote and associates it with the correct caption.
* Because mutating data requires authentication, you must ensure that only logged-in users are able to submit votes. If a user is not logged in, they should not be able to rate captions. Your app should use the authentication system you implemented previously to enforce this.
* The purpose of this assignment is to help you understand how modern web apps allow users to create and modify data, not just display it.
* You’ll also want to turn RLS (row level security) on for all the tables in your Supabase database. You’ll want to enforce the strictest RLS rules possible without breaking your application.
* Finally, you will need something for your users to vote on! Give your users the ability to generate some type of media with AI (for example, with the Crackd.ai website, we allow our users to upload photos and get back AI generated captions).
* Save the AI generated media in your database so that users can vote on them. Also be sure to save the prompts you used to generate the media for each each.
* When designing an application, it is important to think about your audience. A fictitious persona that represents one of your users is known as a “user persona”. The user persona for this assignment is:
* Sam is a junior in Columbia College who is chronically online. Sam grew up in the midwest and is fairly new to New York City. They live in the dorms and explore the city on weekends. Think deeply about the following questions when designing your application:
  1. What would get users to come to your web site every day?
  2. How does this site become a popular source of content?
  3. How would you make the Crackd.ai web application better and how does that suggestion make your own content-generation and rating application better?
* Your Product Manager will act as your Product Manager for this assignment. It’s your job to listen carefully to their feedback when they try out your application during the Feedback Group session. Iterate on their feedback and implement their suggestions.
* Turn off Vercel “deployment protection” so that you can view your page in Incognito Mode.
* When you are finished, deploy your app to Vercel and submit the commit-specific URL of your deployment in the Submissions section.
