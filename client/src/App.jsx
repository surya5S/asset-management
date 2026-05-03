import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageWrapper from "./components/layout/PageWrapper";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <PageWrapper>
          <AppRouter />
        </PageWrapper>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Layout Shell                 - Navbar, PageWrapper, Footer wrap AppRouter. Every page
                                    automatically gets the navbar and footer — no need to
                                    include them in individual page files.
  2. Render Order                 - Navbar renders first (top), then the page content, then
                                    Footer. Both are fixed-position so render order doesn't
                                    affect layout — but it communicates intent clearly.
  3. PageWrapper role             - Adds pt-20 pb-16 so page content never hides under the
                                    fixed navbar or footer. Central padding management.
*/
