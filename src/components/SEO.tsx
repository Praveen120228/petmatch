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
            <title>{title} | PetMatch</title>
            {description && <meta name="description" content={description} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={`${title} | PetMatch`} />
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}

            {/* Twitter */}
            <meta name="twitter:creator" content={name || "PetMatch"} />
            <meta name="twitter:card" content={type === 'article' ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={`${title} | PetMatch`} />
            {description && <meta name="twitter:description" content={description} />}
        </Helmet>
    );
};

export default SEO;
