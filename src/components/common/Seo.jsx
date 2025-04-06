"use client";
import Head from 'next/head';

const Seo = ({
  title = "Yotto Stones - Мрамор и Гранит за вашия дом и бизнес",
  description = "Открийте висококачествени естествени камъни - мрамор, гранит, варовик и още за интериорни и екстериорни проекти.",
  keywords = "мрамор, гранит, естествен камък, интериор, екстериор, плотове, стъпала, облицовки, България, Yotto Stones",
  canonical = "https://www.yottostones-bg.com/",
  image = "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b",
  locale = "bg_BG",
}) => {
  return (
    <Head>
      {/* Primary Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};

export default Seo;
