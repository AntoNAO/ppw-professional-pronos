
import fs from "node:fs"
import path from "node:path"

const wrestlers = {
  JEY: "Jey Uso",
  JIMMY: "Jimmy Uso",
  REIGNS: "Roman Reigns",
  ZAYN: "Sami Zayn",
  GUNTHER: "Gunther wrestler",
  SOLO: "Solo Sikoa",
  JACOB: "Jacob Fatu",
  TAMA: "Tama Tonga wrestler",
  TANGA: "Tanga Loa",
  OBA: "Oba Femi",
  FENIX: "Rey Fenix",
  LESNAR: "Brock Lesnar",
  MCINTYRE: "Drew McIntyre",
  KAISER: "Ludwig Kaiser",
  PRIEST: "Damian Priest",
  LA: "LA Knight",
  SHEAMUS: "Sheamus wrestler",
  REED: "Bronson Reed",
  CREWS: "Apollo Crews",
  MYSTERIO: "Rey Mysterio",
  BIG_E: "Big E wrestler",
  SANTOS: "Santos Escobar",
  CARDONA: "Matt Cardona wrestler",
  DRAGUNOV: "Ilja Dragunov",
  STYLES: "AJ Styles",
  BREAKER: "Bron Breakker",
  HAYES: "Carmelo Hayes",
  PAUL: "Logan Paul wrestler",
  THEORY: "Austin Theory",
  WALLER: "Grayson Waller",
  NAKAMURA: "Shinsuke Nakamura",
  DUNNE: "Pete Dunne wrestler",
  BATE: "Tyler Bate wrestler",
  FRAZER: "Nathan Frazer wrestler",
  AXIOM: "Axiom wrestler",
  TRICK: "Trick Williams wrestler",
  FORD: "Montez Ford",
  DAWKINS: "Angelo Dawkins",
  KIT: "Kit Wilson wrestler",
  BALOR: "Finn Balor",
  TOZAWA: "Akira Tozawa",
  GABLE: "Chad Gable",
  DOMINIK: "Dominik Mysterio",
  JD: "JD McDonagh",
  ROCK: "Dwayne Johnson wrestler",
  OMEGA: "Kenny Omega",
}

const directory = path.join(process.cwd(), "public", "wrestlers")
const results = []

for (const [code, name] of Object.entries(wrestlers)) {
  if (fs.existsSync(path.join(directory, `${code}.png`))) {
    console.log(`Déjà présent : ${code}`)
    continue
  }

  console.log(`Recherche : ${name}`)

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: name,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "400",
    iiextmetadatafilter:
      "LicenseShortName|LicenseUrl|Artist|Credit|UsageTerms",
    format: "json",
    formatversion: "2",
  })

  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      {
        headers: {
          "User-Agent": "PPWImageResearch/1.0 (local research script)",
          "Accept": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0]
      if (!info?.url) continue

      results.push({
        wrestlerCode: code,
        wrestlerName: name,
        fileTitle: page.title,
        previewUrl: info.thumburl ?? info.url,
        imageUrl: info.url,
        sourcePage: info.descriptionurl,
        license: info.extmetadata?.LicenseShortName?.value ?? "À vérifier",
        licenseUrl: info.extmetadata?.LicenseUrl?.value ?? "",
        artist: info.extmetadata?.Artist?.value ?? "",
      })
    }
  } catch (error) {
    console.error(`Erreur pour ${name}:`, error.message)
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
}

fs.mkdirSync("scripts", { recursive: true })
fs.writeFileSync(
  "scripts/wrestler-candidates.json",
  JSON.stringify(results, null, 2)
)

console.log(`\nTerminé : ${results.length} propositions enregistrées.`)
console.log("Fichier : scripts/wrestler-candidates.json")
