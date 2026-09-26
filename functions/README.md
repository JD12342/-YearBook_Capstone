# Admin database analytics setup

The `getDatabaseAnalytics` callable function keeps Google Cloud Monitoring and billing access out of the browser. It verifies the signed-in Firebase user is an active `Administrator` before returning data.

## Google Cloud configuration

1. Upgrade the Firebase project to the Blaze plan so Cloud Functions can be deployed.
2. Enable the Cloud Monitoring API and BigQuery API.
3. In **Billing > Billing export**, enable the **Standard usage cost** export to a BigQuery dataset.
4. Copy `.env.example` to `.env` in this folder and set `BILLING_EXPORT_TABLE` to the generated `project.dataset.table` name. Optionally set `MONTHLY_BUDGET`.
5. Grant the function runtime service account:
   - Monitoring Viewer on the Firebase project.
   - BigQuery Job User on the project used to run the query.
   - BigQuery Data Viewer on the billing export dataset.
6. Install and deploy:

   ```sh
   cd functions
   npm install
   cd ..
   firebase deploy --only functions:getDatabaseAnalytics
   ```

The Reports page still works if monitoring or billing is not configured; it shows an actionable setup state for the missing source.
