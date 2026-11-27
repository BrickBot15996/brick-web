# CDN manifest

Files that agents need on `cdn.brickbot.ro`. Paths follow CLAUDE.md §11. The owner uploads each file and flips its status to `uploaded`.

| Path | Description | Format / size | Status |
|---|---|---|---|
| `brand/logo.svg` | Primary logo mark (bolt in brick ring). Drawn as a CSS mask in #FFEC17, so any single fill works | SVG, 326×232 | requested |
| `brand/wordmark.svg` | BRICKBOT wordmark: the hero name, the nav and the footer. Drawn as a CSS mask | SVG, 1115×217 | requested |
| `brand/og-default.jpg` | Default social preview | JPG, 1200×630 | requested |
| `site/home/hero.webp` | Hero: students in yellow shirts cheering, arms up, 2026 Romania National Championship. A larger original (≥2560 px long edge) is welcome; the hero is full-bleed | WebP, 1616×1080 (≥2560 wide preferred) | requested |
| `seasons/decode/team-photo.webp` | DECODE team photo at the 2026 FIRST Championship stage (home "Who we are" section) | WebP, 960×640 (≥1600 wide preferred) | requested |
| `gallery/decode/worlds-practice-field.webp` | Robot on a practice field at the 2026 FIRST Championship (home scoreboard) | WebP, 1600×1069 | requested |
| `site/home/schools-classroom.webp` | BrickBot in Schools: team members with a class and their teacher (home outreach) | WebP, 1280×960 | requested |
| `site/home/joy-in-motion.webp` | Outdoor event stand in Focșani with kids trying the robot (home outreach) | WebP, 1680×1120 | requested |
| `sponsors/{sponsor}.webp\|png\|svg` | The 22 sponsor logos of 2025–26, white on transparent (home perimeter board); file names are listed in `apps/website/src/lib/sponsors.ts` | as supplied | requested |
| `external/natie-prin-educatie.svg` | Nație prin Educație logo bar (footer, mandatory) | SVG, 642×51 | requested |
| `external/anpc-sal.webp` | ANPC SAL badge (footer, mandatory) | WebP, 510×127 (SVG preferred) | requested |
| `external/anpc-sol.webp` | EU ODR / SOL badge (footer, mandatory) | WebP, 509×126 (SVG preferred) | requested |
| `site/join/sparkhope-2025.webp` | Team cheering at the SparkHope Robotics Cup, Aug 2025 (Our Story and Join headers, Gallery) | WebP, 1280×851 (≥1600 wide preferred) | requested |
| `site/home/schools-video.webp` | BrickBot in Schools: two members presenting a robot video to a class (Gallery) | WebP, 1280×854 | requested |
| `seasons/biobuzz/team-photo.webp` | 2026–27 team on the steps of “Unirea” National College (Team header, Our Story, BioBuzz season) | WebP, 1600×1066 | requested |
| `seasons/{season}/team-photo.webp` | Group photo for every other season, 2016–17 to 2024–25 (Team “Season by season”, season pages). Each appears automatically once its key is added to `apps/website/src/lib/seasons.ts` | WebP, ≥1600 wide, 3:2 | requested |
| `seasons/{season}/robot.webp` | The robot of each season, on a plain background (season pages; links to Onshape) | WebP, ≥1600 wide | requested |
| `seasons/{season}/portfolio.pdf` | Engineering portfolio of each season (season pages) | PDF | requested |
| `seasons/{season}/game-logo.svg` | FTC game logo of each season (season pages, optional) | SVG or transparent PNG | requested |
| `documents/sponsor-deck-2026-27.pdf` | Sponsor deck (Partner with us). The Download button appears once it exists | PDF | requested |
| `documents/sample-contract.pdf` | Sample sponsorship contract (Partner with us). The Download button appears once it exists | PDF | requested |
| `brand/logo-black.svg`, `brand/wordmark-black.svg` | Dark variants of the logo and wordmark for light backgrounds (Press kit) | SVG | requested |
| `press/photos/{name}.webp` | Approved press photos at full resolution (Press kit currently offers the site photos) | WebP, long edge 2560 | requested |
| `site/join/{department}/{name}.webp` | One or two photos per department for the Join page: `assembly-3d-design`, `programming`, `events`, `social-media`, `graphic-design`, `photo-video`, `fundraising` (students at work) | WebP, ≥1600 wide, 3:2 | requested |
| `projects/{project}/logo.svg` | Logo of each project, for the Projects grid and each project page: `focsani-tech-challenge`, `brick-by-brick-school`, `brickbot-caravan`, `first-steps-into-steam`, `ftc-sparks`, `brickdocs`. Shown as an image on a black LED board, so it should read on black (light or coloured artwork, transparent background). Until it exists the team logo stands in; set `logo` in `apps/website/src/lib/projects.ts` once uploaded | SVG preferred, otherwise transparent PNG | requested |
| `seasons/decode/portfolio.pdf`, `seasons/decode/portfolio-cover.webp` | DECODE engineering portfolio and its cover (season page). Currently linked from the old bucket paths `projects/the-vault/portfolios/brickbot-decode.pdf` and `projects/the-vault/thumbnails/brickbot-decode.webp`; copy them to these keys, then switch `portfolio` in `apps/website/src/lib/seasons.ts` | PDF; WebP 3508×2480 | requested |
| `seasons/decode/robot.webp` | DECODE robot photo (season page), plus the robot's public Onshape link. The robot card appears once the photo is set in `apps/website/src/lib/seasons.ts` | WebP, ≥1600 wide, 16:10 | requested |
