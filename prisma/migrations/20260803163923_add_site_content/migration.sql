-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "businessName" TEXT NOT NULL DEFAULT 'Vijaya Premix',
    "brandDescription" TEXT NOT NULL DEFAULT 'Ready-to-cook Indian premixes for convenient home cooking.',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "whatsappNumber" TEXT,
    "whatsappMessage" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "youtubeUrl" TEXT,
    "defaultSiteTitle" TEXT NOT NULL DEFAULT 'Vijaya Premix | Ready-to-Cook Indian Premixes',
    "defaultMetaDescription" TEXT NOT NULL DEFAULT 'Ready-to-cook Indian premixes from Vijaya Premix.',
    "defaultOgImage" TEXT NOT NULL DEFAULT '/assets/images/brand/vijaya-premix-logo.jpeg',
    "aboutHeading" TEXT NOT NULL DEFAULT 'Authentic flavour. Less kitchen hassle.',
    "aboutDescription" TEXT NOT NULL DEFAULT 'Vijaya Premix makes ready-to-cook Indian premixes for convenient home cooking.',
    "mission" TEXT,
    "vision" TEXT,
    "promiseText" TEXT NOT NULL DEFAULT 'Original branded pack artwork, honest product information, and convenient home cooking.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSettings" (
    "id" TEXT NOT NULL DEFAULT 'homepage',
    "heroEyebrow" TEXT,
    "heroHeading" TEXT NOT NULL DEFAULT 'Cook Delicious. Cook Instantly.',
    "heroDescription" TEXT NOT NULL DEFAULT 'Authentic flavours without the kitchen hassle.',
    "heroCtaLabel" TEXT NOT NULL DEFAULT 'Shop Premixes',
    "heroCtaUrl" TEXT NOT NULL DEFAULT '/products',
    "heroProductId" TEXT,
    "showOffer" BOOLEAN NOT NULL DEFAULT false,
    "showCategories" BOOLEAN NOT NULL DEFAULT true,
    "showProducts" BOOLEAN NOT NULL DEFAULT true,
    "showPromise" BOOLEAN NOT NULL DEFAULT true,
    "showPackToPlate" BOOLEAN NOT NULL DEFAULT true,
    "showRecipeVideo" BOOLEAN NOT NULL DEFAULT true,
    "showReviews" BOOLEAN NOT NULL DEFAULT true,
    "showPreorder" BOOLEAN NOT NULL DEFAULT true,
    "showGallery" BOOLEAN NOT NULL DEFAULT false,
    "showNewsletter" BOOLEAN NOT NULL DEFAULT false,
    "promiseHeading" TEXT NOT NULL DEFAULT 'Our Promise',
    "promiseDescription" TEXT NOT NULL DEFAULT 'Authentic flavour made convenient for your kitchen.',
    "promiseItems" JSONB NOT NULL DEFAULT '[]',
    "packToPlateItems" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSettings_pkey" PRIMARY KEY ("id")
);
