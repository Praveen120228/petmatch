import { Helmet } from 'react-helmet-async';

// ... interface
interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    name?: string;
    type?: string;
    image?: string;
    canonicalUrl?: string;
    structuredData?: object;
}

const SEO = ({ title, description, keywords, name, type = 'website', image, canonicalUrl, structuredData }: SEOProps) => {
    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{title} | Specyf</title>
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
// ...
            <meta property="og:title" content={`${title} | Specyf`} />
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}
            {/* If canonical URL is provided, use it as og:url as well */}
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

            {/* Twitter */}
            <meta name="twitter:creator" content={name || "Specyf"} />
            <meta name="twitter:card" content={type === 'article' ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={`${title} | Specyf`} />
            {description && <meta name="twitter:description" content={description} />}

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
