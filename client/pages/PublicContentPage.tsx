import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPublishedContentPage } from "@/store/slices/settingsSlice";

const PATH_SLUGS: Record<string, string> = {
  "/terminos": "terms-and-conditions",
  "/privacidad": "privacy-policy",
};

export default function PublicContentPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { publishedPage, publishedPageLoading, error } = useAppSelector(
    (s) => s.settings,
  );

  const slug = PATH_SLUGS[pathname] || rawSlug || "";

  useEffect(() => {
    if (slug) {
      dispatch(fetchPublishedContentPage(slug));
    }
  }, [dispatch, slug]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        {publishedPageLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : publishedPage ? (
          <article className="max-w-full break-words">
            <h1 className="text-3xl font-semibold text-foreground">
              {publishedPage.title}
            </h1>
            <div
              className="mt-6 text-foreground"
              dangerouslySetInnerHTML={{ __html: publishedPage.content || "" }}
            />
          </article>
        ) : (
          <p className="text-muted-foreground">
            {error || "Página no encontrada"}
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
