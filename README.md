# Nelson-GPT: Pediatric Medical AI Assistant

## Environment Setup

### Local Development
To set up the project for local development, follow these steps:
1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```
2.  **Install dependencies:**
    ```sh
    npm i
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following variables:
    ```
    MISTRAL_API_KEY="your_mistral_api_key"
    SUPABASE_URL="your_supabase_project_url"
    SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
    ENCRYPTION_KEY="your_encryption_key"
    ```
4.  **Run the development server:**
    ```sh
    npm run dev
    ```

### Supabase CLI Setup
To manage the Supabase backend, you will need to use the Supabase CLI.
1.  **Install the Supabase CLI:**
    Follow the official instructions to install the CLI on your system: [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
2.  **Log in to Supabase:**
    ```sh
    supabase login
    ```
3.  **Link the project:**
    ```sh
    supabase link --project-ref <YOUR_PROJECT_ID>
    ```
4.  **Apply database migrations:**
    ```sh
    supabase db push
    ```

## Environment Variables

*   `MISTRAL_API_KEY`: Your API key for the Mistral service.
*   `SUPABASE_URL`: The URL of your Supabase project.
*   `SUPABASE_PUBLISHABLE_KEY`: The public, anonymous key for your Supabase project.
*   `ENCRYPTION_KEY`: A secret key used for encrypting patient data.

---

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

