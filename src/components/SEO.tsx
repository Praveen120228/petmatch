import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
}

const SEO = ({ title, description, name, type = 'website', image }: SEOProps) => {
    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{title} | Specyf</title>
            {description && <meta name="description" content={description} />}

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={`${title} | Specyf`} />
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name || "Specyf"} />
            <meta name="twitter:card" content={type === 'article' ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={`${title} | Specyf`} />
            {description && <meta name="twitter:description" content={description} />}
        </Helmet>
    );
};

export default SEO;
