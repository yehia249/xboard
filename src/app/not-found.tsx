// app/not-found.tsx
export const metadata = {
    title: "Page Not Found | XBoard",
    description: "Sorry, this page does not exist.",
  };
  
  export const dynamic = "force-dynamic";

  export default function NotFound() {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you requested could not be found.</p>
      </div>
    );
  }
  