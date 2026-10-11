
import candidates from "../../scripts/wrestler-candidates.json"

type Candidate = {
  wrestlerCode: string
  wrestlerName: string
  fileTitle: string
  previewUrl: string
  imageUrl: string
  sourcePage: string
  license: string
  licenseUrl: string
  artist: string
}

export default function WrestlerGalleryPage() {
  const images = candidates as Candidate[]

  const grouped = Object.groupBy(
    images,
    (image) => image.wrestlerCode
  )

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black uppercase tracking-wide">
          PPW — Galerie des portraits
        </h1>

        <p className="mt-2 mb-8 text-sm text-neutral-400">
          {images.length} propositions à examiner.
          Aucune image n'est téléchargée ni remplacée sur ton ordinateur.
        </p>

        <div className="space-y-10">
          {Object.entries(grouped).map(([code, options]) => (
            <section key={code}>
              <h2 className="mb-4 border-b border-neutral-800 pb-2 text-xl font-bold">
                {options?.[0]?.wrestlerName}{" "}
                <span className="text-sm text-neutral-500">
                  ({code})
                </span>
              </h2>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {options?.map((image, index) => (
                  <article
                    key={`${code}-${index}`}
                    className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
                  >
                    <a
                      href={image.sourcePage}
                      target="_blank"
                      rel="noreferrer"
                      title="Voir la page source"
                    >
                      <div className="flex h-56 items-center justify-center bg-neutral-950 p-2">
                        <img
                          src={image.previewUrl}
                          alt={image.fileTitle}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </a>

                    <div className="space-y-2 p-3">
                      <p className="text-sm font-semibold">
                        {image.fileTitle.replace(/^File:/, "")}
                      </p>

                      <p className="text-xs text-neutral-400">
                        Licence : {image.license}
                      </p>

                      <a
                        href={image.sourcePage}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm text-amber-400 underline"
                      >
                        Vérifier la source
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
