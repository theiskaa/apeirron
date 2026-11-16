# First editorial review

This review samples passages from seven selected nodes, alongside a mechanical inventory of all 198. It is not a claim that every source in the collection has been checked.

The original collection contains approximately 1,187,503 whitespace-delimited words after frontmatter, including bibliographies. Excluding `## Sources`, the essays contain 1,112,171 words; the median is 5,705.5 words. Of 198 essays, 113 exceed 5,000 words, 14 exceed 10,000, and 112 contain at least one prose paragraph over 200 words. These baseline counts describe reading burden, not literary quality.

## What the samples show

| Node | Original essay words | Main problem | Rewrite focus |
| --- | ---: | --- | --- |
| [Consciousness](../content/nodes/consciousness.md) | 2,619 | Categorical opening claims, then too many debates; the ending restates the mystery on a grander scale. | Why explaining brain activity and explaining experience can seem like different tasks. |
| [MKUltra](../content/nodes/mkultra.md) | 7,047 | Documented abuses become a bridge to claims about assassins and later operations; damage and successful control get blurred. | What the surviving record establishes, and what its gaps cannot prove. |
| [Göbekli Tepe](../content/nodes/gobekli-tepe.md) | 3,119 | Treats construction skill as evidence of lost teachers; disputed astronomical readings become established knowledge. | What early monument building tells us about the people who built it. |
| [Free Will](../content/nodes/free-will.md) | 2,026 | Initially treats a readiness potential as a settled unconscious decision; the qualification arrives much later. | What Libet measured and how far that result can travel beyond an arbitrary movement. |
| [Nature of Time](../content/nodes/nature-of-time.md) | 2,843 | Moves from physics through metaphysics to simulation and mystical experience without a controlling question. | What relativity changes about a shared present, and what it leaves undecided. |
| [Federal Reserve](../content/nodes/federal-reserve.md) | 8,926 | A dense opening contains a whole verdict; repeated claims overwhelm distinctions between structure, policy, and criticism. | A specific institutional tension, with evidence for how oversight and independence work. |
| [Flat Earth](../content/nodes/flat-earth.md) | 10,667 | The opening tries to explain the movement, belief, institutions, algorithms, and epistemology at once; the ending diagnoses motives too broadly. | A few testable claims and the difficulty of agreeing on what counts as a test. |

## The instructions were part of the problem

The previous `.claude/skills/write-node/SKILL.md` required essays that were “never short” and used line counts of dense prose as a measure of depth. It instructed writers to copy the tone of large existing nodes, present “both sides” as a general posture, and avoid hedging in graph reasons. Its examples themselves made strong causal claims.

That creates a feedback loop: breadth and certainty become the house style because the house style is defined by the existing drafts. The new [editorial standard](editorial-standard.md) replaces that instruction. The revised skill also removes stale advice about `lib/paths.ts`; the current reading sequence lives in `content/roadmap.json`.

## First batch and remaining work

The first batch rewrites Consciousness, MKUltra, and Göbekli Tepe as concrete examples of the selected voice. It reviews each complete essay, description, sources, and outgoing connection reasons. Graph targets remain in place. Unedited neighbors can still contain overstated reciprocal reasons; they remain in the backlog.

[The inventory](node-rewrites.json) lists every node with its original word count and an explicit status. A completed essay is recorded as `rewritten`; other nodes remain `pending`. The inventory is the current record of remaining scope. Each entry records substantive review, rather than an automatic wording substitution.

The corpus pass follows `content/roadmap.json` one node at a time, skipping essays already rewritten. Keep the inventory cursor current after each completed node. Sensitive allegations, health claims, and claims about living people need source review alongside prose revision; an old bibliography is not verification.

The first batch used a 1,000–1,600-word target. After reading it, the user rejected all three essays as much too short. That target is withdrawn. All three have been expanded with substantive explanations, evidence, and historical context; the standard now has no routine word ceiling. Record the actual editorial question and source issues per batch, so the standard improves through examples instead of accumulating arbitrary prohibitions.

Published audio for rewritten nodes must be withheld from the manifest until it matches the new text. Existing PDF/EPUB books remain earlier editions until explicitly regenerated.

## Three review passes after the depth correction

All three essays were expanded and reviewed again. Their current lengths are recorded in the inventory; each is now about 3,000 words, excluding frontmatter and sources. This is a result of the material developed, rather than a replacement word-count rule.

| Pass | What needed revision | Changes made |
| --- | --- | --- |
| Depth and structure | The first versions outlined subjects without explaining enough of their evidence or history. | Added worked philosophical examples, perception experiments, anesthesia research and clinical awareness; expanded the MKUltra chronology and individual settings; developed construction, provisioning, imagery, and deposit interpretation at Göbekli Tepe. Removed the routine word ceiling from the skill, standard, and contributor guide. |
| Voice and movement | Some expanded passages commented on how an account ought to be written, and repeated cautions already established. | Replaced editorial commentary with direct explanation; made Olson, Cameron, White, and the Lexington research more concrete; examined a particular carved pillar rather than only discussing symbolism in general. Rebuilt the skill around selection, development, judgment, and transitions. |
| Evidence and consistency | New depth required additional sources and clearer distinctions between findings and interpretations. | Added primary research references, a court account of Subproject 68, an archival institutional example, and an illustrated source for Pillar 43. Checked ids, categories, graph targets, wiki links, descriptions, source structure, narration status, and skill references. |

Source verification focused on introduced or challenged claims and the identifiable supporting publications. Retained book references remain part of the bibliography; this review does not claim a fresh page-by-page audit of every cited book.

The skill now calls for these three distinct passes on substantial drafts, including revision and rereading after each. Literary quality is still a judgment; a recorded pass is not a score or an automatic approval.

## Sequential corpus pass

The first continuation follows the reading path: The Hard Problem, The Simulation Hypothesis, The Nature of Time, The Fermi Paradox, and UFOs & UAPs. Each received a new body, a description review, outgoing-reason review, and three editorial passes. The inventory records the specific changes and current word counts.

This brings the completed total to eight of 198 essays; 190 remain pending. The next node is `aatip-disclosure`. The original three calibration essays remain completed. Narrations for the five newly rewritten nodes are withheld until they match the revised text.

## Continued review and the next three essays

The eight completed essays received a full reread and a further prose revision. Repeated qualifications and comments about how to interpret an account were replaced with worked examples and direct explanation. Their updated word counts are in the inventory. The writing skill and editorial standard were unchanged during this follow-up.

The sequential pass then rewrote `aatip-disclosure`, `roswell`, and `area-51`, each at roughly 3,200 words before sources. The AATIP essay now follows the procurement and special-access review instead of assuming one continuous disclosure program. Roswell distinguishes contemporary documents from later testimony and corrects the account of the GAO's records findings. Area 51 develops the aircraft engineering, distinguishes the A-12 and SR-71, and describes the environmental litigation and congressional reporting rules more accurately. All three received depth, voice, and evidence reviews, with specific notes in the inventory.

At this checkpoint, eleven of 198 nodes are rewritten and 187 remain. The next node is `majestic-12`. The production build and structural content checks passed for the eleven completed essays. Existing audio is withheld for the three new rewrites. Book files remain earlier editions.

## Document cases and Apollo

The next continuation rewrote `majestic-12`, `skinwalker-ranch`, `project-blue-beam`, and `moon-landing`, bringing the inventory to fifteen rewritten essays and 183 pending. The next node is `operation-mockingbird`. Their individual review notes explain the depth, voice, and evidence revisions.

Majestic-12 now distinguishes an archival copy from an authenticated record and separates the authorship question from the case against authenticity. Skinwalker follows the dated family account and participant interviews without treating every unexplained report as one mechanism. Blue Beam separates circulating reprints from a verified original and develops the actual display/radio questions. Apollo now evaluates several forms of evidence together, with corrected radiation units, sample-water claims, imaging capabilities, and tape-preservation history.

The production build passed at this fifteen-essay checkpoint, along with metadata, graph-target, wiki-link, word-count, source-structure, compiled-article, and narration checks. All fifteen old audio entries remain withheld. The writing skill and editorial standard remain unchanged during this follow-up.

## Press relationships, Monarch, and remote viewing

The continuation has reached eighteen rewritten essays and 180 pending. Operation Mockingbird now follows distinct covert relationships instead of attributing decades of news coverage to one continuous program. Project Monarch separates the record of abusive research from alleged successful identity programming, explains the memory evidence, and treats the Greenbaum transcript as a claim with identifiable provenance limits. Star Gate follows Kress's crane and the missed derricks, develops blind judging and a specific SAIC design, and distinguishes a laboratory score from a useful intelligence source.

Each essay received separate depth, voice, and evidence revisions, recorded in the inventory. All outgoing reasons were revised and old narration withheld. The existing satanic-panic target is a phantom graph node, so Monarch's body uses ordinary prose there. Targets were preserved. The skill and editorial standard remain unchanged in this follow-up. The next node in the reading path is tuskegee-experiment.

## Tuskegee

The nineteenth rewrite follows how the Public Health Service study displaced informed choice and adequate treatment, then survived internal objections. The three review passes added the documented 1941–42 military-board intervention and named survivors at the 1997 apology, revised repeated editorial signposting, and corrected chronology and evidentiary overstatement. The essay preserves the distinctions between study policy and incidental outside drug exposure, Tuskegee and deliberate infection in Guatemala, and the dated stages of settlement and health benefits. The next reading-path node is jonestown; 179 essays remain pending.

## Jonestown

Twenty essays are rewritten, with 178 pending. The Jonestown rewrite follows Christine Miller's objection, residents' dependence, Ryan's visit, the airstrip killings, survivor accounts, and the limited forensic investigation. Its three reviews developed the differences among coercion, apparent compliance, and individual roles; trimmed repeated editorial framing; and checked the claim against primary transcripts, interviews, medical correspondence, and dated official reporting. The old claim that all official records call the deaths voluntary suicide was contradicted by the records themselves. All five graph reasons were revised and the old narration withheld. The next node is operation-paperclip.

## Paperclip

Twenty-one essays are rewritten, with 177 pending. Paperclip now follows the actual 1946 authorization, screening, requested security-report revisions, forced labor, American careers, and later proceedings. The reviews added von Braun's specific development-to-production visits, revised abstract editorial framing, and distinguished camp-complex casualty figures, program counts, immigration action, and individual conduct. All thirteen outgoing reasons were rewritten; weak comparisons and conflated migration histories are flagged in the inventory. The next node is jfk.

## JFK

Twenty-two essays are rewritten, with 176 pending. The JFK essay follows the shooting evidence and the failures of the conspiracy inquiry as separate questions. Three reviews developed the bridge between rifle ownership and firearms examination, preserved witness conflicts, replaced repeated editorial cautions with concrete Mexico City evidence, and checked the acoustic dispute, primary Vietnam memoranda, and release history through NARA’s January 2026 listing. All nine outgoing reasons were revised and the old narration withheld. The twenty-one-node production build passed before this rewrite; the next full build includes JFK. The next reading-path node is marilyn-monroe.

## Marilyn Monroe

Twenty-three essays are rewritten, with 175 pending. Monroe now follows the autopsy, discovery timeline, telephone toll records, and the 1982 inquiry, with later allegations kept at their actual evidentiary status. The three reviews developed the difference between death and discovery, removed repetitive editorial cautions, and replaced an unsupported tissue-disposal narrative with the testing scope described in Noguchi’s interview. They retained criticism of the DA report’s stereotypes rather than treating the official document as infallible. Both connection reasons were rewritten and the old narration withheld. The twenty-two-node production build and compiled-content inspection passed; the next reading-path node is malcolm-x.

## Malcolm X

Twenty-four essays are rewritten, with 174 pending. The Malcolm X essay follows the difference between the case against Halim and the identification cases against Aziz and Islam, the specific evidence concealed from the defense, failed earlier challenges, and the 2021 joint review. Its reviews added the lost practical opportunities for defense investigation and the filing’s legal analysis, cut generic editorial framing, and checked chronology and attribution against primary records. The 2026 civil order is described as a procedural ruling, with allegations distinguished from findings. All six outgoing reasons were revised; unsupported drug-trafficking and media-control connections are flagged. Old narration is withheld. The twenty-three-node production build passed. The next reading-path node is mlk-assassination.

## Martin Luther King Jr.

Twenty-five essays are rewritten, with 173 pending. The King essay develops the evidence against Ray, the FBI campaign, police personnel changes, the actual civil jury instructions and verdict, and the evidence tested by the later federal inquiry. Three reviews expanded the attorney-mail interception and geometry, removed repetitive editorial framing, and checked both closing arguments rather than describing the civil case as wholly uncontested. The account corrects the claim that no jury heard plea evidence, distinguishes the two legal proceedings, and includes the July 2025 archival publication. All three graph reasons were rewritten and the old narration withheld. The next reading-path node is rfk-assassination. The twenty-five-node production build passed.

## Robert F. Kennedy

Twenty-six essays are rewritten, with 172 pending. The RFK essay follows the close-range fatal wound through the witness accounts, the original and 1975 firearms examinations, and the preservation failures. Three reviews added the distinction between the neck bullet and fatal fragments, developed the trial’s mental-capacity defense and its consequences, cut repeated editorial cautions, and checked the actual records behind the alleged second gunman and hypnosis operation. It corrects wound locations, the simple nine-versus-eight count, the claim that no independent firearms examination occurred, the treatment of Schulman as consistent, the blanket amnesia claim, and the date of Newsom’s parole reversal. All six connection reasons were rewritten and weak media/network edges flagged. The old narration is withheld. The next reading-path node is john-lennon.

## John Lennon

Twenty-seven essays are rewritten, with 171 pending. The Lennon essay develops the documented deportation campaign, the actual immigration-law dispute and dissent, the long disclosure case, and Chapman’s accounts of preparation and motive. Three reviews expanded the agency’s delayed applications and Chapman’s employment history, replaced repetitive editorial verdicts with documentary details, and checked the disputed claims against facsimiles, court decisions, and parole transcripts. The financial explanation in 2010, the 2006 final release, the distinction between the immigration ruling and selective-enforcement allegations, and the unverified doorman identity are now explicit. All four reasons were rewritten, weak media/movement edges flagged, and stale narration withheld. The twenty-seven-node production build passed. The next reading-path node is princess-diana.

## Diana, Princess of Wales

Twenty-eight essays are rewritten, with 170 pending. The Diana essay develops the real Fiat collision, late departure plan, contested toxicology with the precise limits of DNA testing, changing intelligence allegations, separate warnings, medical timeline, embalming and hormone-test evidence, and the inquest’s actual verdict choices. Three reviews added the speed-estimation and authorization chain, cut repeated editorial framing, and checked the warnings’ date and authorship, the test limits, and the distinction between an inquest finding and a criminal conviction. It corrects the claim that the bodyguard wore a seatbelt and the implication that unlawful killing endorsed a murder plot. Dyson’s later findings give distrust a documented context without making them evidence of the crash’s authorship. All four connection reasons were rewritten and the ritual/media edges flagged. Old narration is withheld. The next reading-path node is tupac-biggie.

### Tupac and Biggie checkpoint

Rewrote `tupac-biggie` to 2,952 essay words and completed all three reviews. The draft now follows the MGM assault, the evidence and contested admissions behind Davis’s conviction, the Wallace family’s discovery litigation, the federal closing memorandum, and the competing Poole and Kading accounts. The depth review added the fabricated confession used in the alleged intermediary’s interview and McClure’s explanation of the task force’s closure. The voice review removed repeated editorial cautions in favor of particular records and decisions.

The evidence review updated Davis’s status to his August 31, 2026 conviction and October 13 sentence of forty years to life, with a November appeal report. It distinguished responsibility for arranging the attack from identification of a particular gunman; corrected the claim about a 4,000-page political-surveillance file; and distinguished the 2005 mistrial, the June 2006 rejection of deception by the family’s lawyers, and the April 2010 agreed dismissal. The indictment, relevant grand jury testimony, court orders, and FBI communications were checked directly; current trial and appeal reporting and reporting on the unrecorded intermediary interview are identified as such. Rewrote all four outgoing reasons and flagged the unsupported CIA-drugs/Webb operational connections in the inventory. Withheld the stale narration.

**Progress:** 29 of 198 rewritten; 169 remain. Next in reading order: `celebrity-27-club`. Metadata/link/review/audio validation passes for all 29. The writing skill remains unchanged during this follow-up.

### The 27 Club checkpoint

Rewrote `celebrity-27-club` to 2,902 essay words and completed all three reviews. The essay now examines how the category was assembled, works through the missing-denominator problem, explains the 2011 mortality cohort and its exclusions, and distinguishes that question from the 2024 study of posthumous attention. It develops the Johnson folklore through named teachers and the separate Tommy Johnson account, then compares the surviving death records without treating age as forensic evidence.

The depth review added Joplin’s autopsy and *Pearl*, including its actual UK chart peak, and explained relative hazard and uncertainty in the corrected Hepp study. The voice review removed the rhetorical-question opening, generic warnings, and repeated editorial conclusions. The evidence review checked original studies and relevant primary medical, police, chart, and survey material. It corrected the two-year founding chronology and separated the open Hendrix verdict, Jones police reviews, Morrison’s external examination and reported symptom history, Winehouse’s second inquest, and the Cobain review/challenge. It removed unverified intelligence-supply claims, handler accusations, numerical mysticism presented as cause, and misleading claims of official homicide reclassification. Rewrote all three graph reasons and flagged the weak operational interpretations. Withheld stale narration.

**Progress:** 30 of 198 rewritten; 168 remain. Next in reading order: `paul-is-dead`. Validation passes for all 30. The production build through 29 completed successfully, including compiled article section/source checks; the next batch build will include this essay.

### Paul Is Dead checkpoint

Rewrote `paul-is-dead` to 2,665 essay words and completed all three reviews. The essay follows Harper’s campus article and invitation for contributions, LaBour’s account of invented details, the Abbey Road image and failed age clue, reversed-speech expectations, the photographic identity claim, and McCartney’s contemporary explanation. The depth review developed the difference between an identity inquiry and symbolic interpretation, then added the October 1969 AP correction. The voice review removed editorial signposting and repeated cautions from ten passages and reread the full revision.

The evidence review used the digitized Drake issue, a full reproduction of LaBour’s later interview, the official Beatles session account, the contemporary AP report, the reproduced Life interview, Vokey’s account of his own research, the surviving Wired opening, and the official Paul Is Live entry. The Michigan Daily original was inaccessible; LaBour’s recollections are identified as such. The unavailable Wired continuation is not represented as read. Corrected the broadcast/publication interval, age clue, and magazine-versus-journal distinction; removed the composite quotation misattributed to Life, universal spread claims, unverified expert consensus, and operational inference. Both graph reasons rewritten and the weak counterculture edge flagged. Stale narration withheld.

**Progress:** 31 of 198 rewritten; 167 remain. Next in reading order: `kurt-cobain`. Validation and the thirty-one-node production build pass. The writing skill remains unchanged during this follow-up.

### Kurt Cobain checkpoint

Rewrote `kurt-cobain` to 3,032 essay words and completed all three reviews. The essay follows the actual toxicology measurement and relevant study limits, the 1994 and 2025 note examinations, the contemporary warning about credit-card timestamps, the 1996 response to an alleged solicitation, the contents and limits of the 2014 review, and the newer forensic paper’s stated assumptions. It also develops the distinction between public disclosure, family privacy, and physical preservation.

The depth review added the Cameron follow-up instruction, Ciesynski’s earlier role, and the missing premises in the inheritance argument. The voice review revised ten passages and cut repeated editorial verdicts. The evidence review checked relevant primary police reports, medical documents and the laboratory sheet, Green’s report, relevant sections of Burnett et al., the 2018 appellate ruling, and September 2026 custody records. It corrects codeine from 0.93 to 0.11 mg/L, identifies the actual medical case, and removes the claims that the note went unexamined, the gun had no lifted impressions, credit-card entries establish purchases after death, and the 2014 report ignored toxicology and firearm questions. The 2025 paper is distinguished from its 2026 publicity and from an official reclassification. The new account includes the firearm’s documented September 2022 destruction, rather than repeating that its earlier photographed retention answers all preservation concerns. It does not infer a concealed homicide from the disposal entry. All three outgoing reasons were rewritten; unsupported operational interpretations are flagged. Stale narration withheld.

**Progress:** 32 of 198 rewritten; 166 remain. Next in reading order: `cia-drugs`. Metadata, link, review-record, and stale-audio validation passes for all 32; the production build through 31 passed. The writing skill remains unchanged during this follow-up.

### CIA drug-trafficking checkpoint

Rewrote `cia-drugs` to 2,854 essay words and completed all three reviews. The essay follows the 1982 reporting agreement, SETCO’s failed records trace, the debate over retaining Rivas and his eventual departure, the disputed effect of CIA contact concerning Zavala’s seized money, the distinct findings prompted by Webb’s reporting, and Bromwich’s account of delayed disclosure. The Laos and Afghanistan passages compare priorities without claiming one universal operation.

The depth review added the missing SETCO routing evidence and the inspector general’s stated overall conclusion. The voice review made eleven revisions, removing repeated verdicts and letting the records and disagreements carry the argument. The evidence review checked relevant original Senate report passages, CIA report sections and the release statement, Smith’s letter, Webb’s first-day article, Justice’s findings and epilogue, McCoy’s publishing correspondence, Leary’s position, and SIGAR’s relevant findings. It corrects the reporting agreement’s scope, the claim of categorical immunity, the characterization of Harper & Row’s response, and assertions that the reports vindicated all California and national-market claims. It withdraws the unverified drug-flight, banking, Mena/anthrax, and media-command connections rather than treating them as established background. All 18 outgoing reasons were rewritten, with weak relationships explicitly flagged in the inventory. Stale narration withheld.

**Progress:** 33 of 198 rewritten; 165 remain. Next in reading order: `gary-webb`. Metadata/link/review/audio validation passes for all 33. The next production build is running and includes Cobain and this essay. The writing skill remains unchanged during this follow-up.

### Gary Webb checkpoint

Rewrote `gary-webb` to 3,081 essay words and completed all three reviews. The essay now follows the original claims, the linked evidence archive, substantive criticism, shared editorial responsibility, Webb’s contemporary defense, reported CIA public-affairs activity, the later inquiries’ distinct findings, and his continued work. The depth review added the supplier/customer sentencing disparity and the limits of institutional self-examination. The voice review revised thirteen passages and removed repeated editorial announcements and cautions.

The evidence review corrected the newspaper headline and staffing detail, first-volume release date, treatment of Ceppos’s acknowledgment, Blandón’s prosecution, the departure chronology, and the death date. It removed total-vindication, no-later-employment, coordinated-command, and unsupported homicide claims. The original CIA public-affairs article and full Ceppos column were unavailable: the essay identifies Devereaux’s reporting and the Justice report’s quotations as its routes to those accounts. The Esquire subscription article is not represented as read. All six outgoing reasons were rewritten; the weak Tupac/Biggie and Malcolm X relationships are flagged for later graph review. Stale narration withheld.

**Progress:** 34 of 198 rewritten; 164 remain. Next in reading order: `octopus-promis`. Metadata/link/review/audio validation passes for all 34. The production build through 34 passed, including the compiled Webb article and sources. The writing skill remains unchanged during this follow-up.

### Octopus and PROMIS checkpoint

Rewrote `octopus-promis` to 2,853 essay words and completed all three reviews. The essay now follows the delivered software, separate ownership and license questions, the vacated bankruptcy findings, congressional oversight and dissent, the omitted 1997–1998 compensation proceedings, actual software comparisons, the backdoor allegation, and Casolaro’s unfinished investigation. The depth pass added concrete licensing and technical-testing explanations. The voice pass revised thirteen passages and removed the unearned Epstein tangent.

The evidence pass used relevant original court findings and reasoning, the official 128-page House report and dissenting views, the preserved Bua and 1994 departmental reviews, and OJP abstracts for the software’s purposes. It caught an important discrepancy: the later appellate summary describes six agencies, but the hearing officer’s actual examination results list systems at five and do not establish an inspection of CIA software. The rewrite uses the detailed list and includes the missing historical-code limitation. It withdraws claims of a binding surviving theft judgment, confirmed international backdoors, proven retaliation against Bason, an established homicide, and operational continuity to Epstein. All seven reasons rewritten; weak graph relationships flagged. Stale narration withheld.

**Progress:** 35 of 198 rewritten; 163 remain. Next in reading order: `bcci-nugan-hand`. Metadata/link/review/audio validation passes for all 35. The production build through 35 passed. The writing skill remains unchanged during this follow-up.

### BCCI and Nugan Hand checkpoint

Rewrote `bcci-nugan-hand` to 2,818 essay words and completed all three reviews. The essay explains hidden ownership, sham lending, the C-Chase plea, the 1985 warning about First American, audit failures, and Nugan Hand’s Yorkville contra arrangement. The depth pass adds an actual cash/deposit/Hawaii sequence and explains the different incentives of a nominee protected from loss. The voice pass revised thirteen passages and removed repeated editorial signposts and general verdicts.

The evidence review distinguishes the Senate text’s draft status, the ministerial account of the Australian commission from its full unread report, and the Bingham debate from the full inquiry report. It corrects the claim that the Australian inquiry confirmed CIA use or a deliberate Golden Triangle drug-deposit office. It includes Altman’s acquittal and the dismissal of Clifford’s criminal charges, separately from the 1998 administrative settlement without admission. It also corrects the claim that all BCCI deposits were permanently lost, using the 2011 reported recovery while retaining the harm of years without access to savings. Withdrew unverified universal Afghan financing, the invented Watergate design lineage, the black-network extrapolation, and deliberate Cold War closure claims. All seven graph reasons rewritten and weak relationships flagged. Stale narration withheld.

**Progress:** 36 of 198 rewritten; 162 remain. Next in reading order: `cointelpro`. Metadata/link/review/audio validation passes for all 36. The production build through 36 passed, with generated and compiled BCCI and PROMIS source sections verified. The writing skill remains unchanged during this follow-up.


### COINTELPRO checkpoint

Rewrote `cointelpro` to 3,579 essay words and completed all three reviews. The essay follows how investigation became approved interference: the foreign-intelligence rationale, headquarters review, the 1968 political goals, King’s campaign, the Panthers’ support and speaking opportunities, forged threats, disclosure, litigation, and oversight. The depth review added the instructions to refute police-brutality allegations after Chicago’s 1968 convention and differentiated the Klan campaign. The voice review revised fifteen passages and relocated that comparison.

The evidence review checked original staff reports and case studies, the House account of the King campaign, the Stern disclosure judgment, the Socialist Workers findings and damages, the Hampton appeal, and the later OIG summary. It corrected the action count and directive date, the coloring-book origin claim, the pre-Watergate disclosure chronology, the television recording detail, and the conflation of disruption with proof of responsibility for specific killings. The three reviews are recorded in the inventory. All sixteen outgoing reasons were revised and weak causal relationships flagged. Stale narration withheld.

**Progress:** 37 of 198 rewritten; 161 remain. Next in reading order: `operation-chaos`. Metadata/link/review/audio validation passes for all 37. The production build through 37 passed, including generated and compiled COINTELPRO sources. The writing skill remains unchanged during this follow-up.


### Operation CHAOS checkpoint

Rewrote `operation-chaos` to 3364 essay words and completed all three reviews. The essay follows the Grove Press file, the foreign-influence question, presidential pressure, HYDRA, negative assessments, agent preparation, distinct Office of Security programs, internal objections, termination, and the Halkin litigation. The depth pass added a worked conference-contact example and distinguished occasional foreign assistance from command. The voice pass revised seventeen passages and replaced the repeated generic legacy argument with the actual decision to keep irrelevant material.

The evidence pass distinguishes files from index entries, the initial authorization from the later code name, MERRIMAC and RESISTANCE from CHAOS, incidental reporting from domestic assignments, and the reasons different Halkin claims failed. It preserves the official inquiries’ different March termination dates. Removed the unsupported story-planting pipeline, automatic lineage to later NSA systems, incorrect MKULTRA administrative home, and the claim that December exposure forced the program to end. All six reasons revised; weak links flagged. Stale narration withheld.

**Progress:** 38 of 198 rewritten; 160 remain. Next in reading order: `gulf-of-tonkin`. Metadata/link/review/audio validation passes for all 38. The production build through 38 passed, with generated and compiled CHAOS source sections verified. The writing skill remains unchanged during this follow-up.


### Gulf of Tonkin checkpoint

Rewrote `gulf-of-tonkin` to 3054 essay words and completed all three reviews. The essay follows the patrol and covert raids, the real first battle, contradictory second-attack reports, the decision to retaliate, the actual signals-intelligence errors and distortions, legislative drafts, the resolution’s scope, and later challenges. The depth pass expanded the different decisions involved in immediate defense and reprisals, and the expiration alternatives considered before August. The voice pass revised fifteen passages and removed the repeated single-cause arguments.

The evidence review distinguishes early error from deliberate later presentation, Hanyok’s argued reconstruction from an agency-wide verdict, and his findings from the rejected claim of proven White House pressure. It checks message timing, changed translation, combined messages, missing expected communications, Herrick’s continued mixed assessments, and the actual June drafts. The final pass adds the enactment/signing date, presidential and congressional termination mechanisms, and the repeal law’s effective-date language. Marcy’s draft and revisions are identified as such. All ten outgoing reasons revised and weak causal connections flagged. Stale narration withheld.

**Progress:** 39 of 198 rewritten; 159 remain. Next in reading order: `operation-northwoods`. Metadata/link/review/audio validation passes for all 39. The production build through 39 passed, including generated and compiled Tonkin source sections. The writing skill remains unchanged during this follow-up.


### Operation Northwoods checkpoint

Rewrote `operation-northwoods` to 2859 essay words and completed all three reviews. The essay develops how the proposed incidents could create apparently independent corroboration, tracing the separate ship, refugee, civil-airliner, and military-pilot scenarios. The depth pass adds provocation of a real Cuban response and its different risks. The voice pass revises sixteen passages and removes the repeated institutional-impossibility argument and broad conspiracy-history catalogue.

The evidence review uses the entire fifteen-page primary release, the actual Mongoose guidelines and March 16 presidential note, the reproduced July press-conference section, and the ARRB’s 1997 announcement/list. It corrects invented passenger detention/family-notification and fatal-pilot scenes, separates mock deaths from proposals including actual harm, and distinguishes submission for planning from execution authority. The guidelines’ would-require-intervention assumption and Kennedy’s lack of authorization remain side by side. No claim of a documented personal veto of every item, punishment by European appointment, or execution through another later program remains. All nine reasons revised; weak causal links flagged. Stale narration withheld.

**Progress:** 40 of 198 rewritten; 158 remain. Next in reading order: `reichstag-fire`. Metadata/link/review/audio validation passes for all 40. The production build through 40 passed, including generated and compiled Northwoods source sections. The writing skill remains unchanged during this follow-up.


### Reichstag fire checkpoint

Rewrote `reichstag-fire` to 3127 essay words and completed all three reviews. The essay now follows the distinction between the fire, the unsubstantiated Communist conspiracy allegation, and the legal decisions that suppressed opposition. The depth pass adds the actual constitutional protections against detention and a 1936 custody order still invoking the fire decree. The voice pass revises twenty passages, replacing the global false-flag template with particular offices, decisions, and consequences.

The evidence review distinguishes the February suspension, the March Enabling Act with its original expiry, and the later retroactive death-penalty statute. It corrects the account of parliamentary control, deputy exclusion, non-Nazi cooperation, sustained public consent, and the trial’s four acquittals. The arson dispute is presented through attributed research and testimony without announcing an invented consensus or treating Lennings’s 1955 account as a Nuremberg deposition. Actual government replies are distinguished from allegations printed in parliamentary questions. All four reasons revised; broad contextual and unsupported causal links flagged. Stale narration withheld.

**Progress:** 41 of 198 rewritten; 157 remain. Next in reading order: `lusitania`. Metadata/link/review/audio validation passes for all 41. The production build through 41 passed, including generated and compiled Reichstag source sections. The writing skill remains unchanged during this follow-up.


### Lusitania checkpoint

Rewrote `lusitania` to 3105 essay words and completed all three reviews. The essay develops the physical evacuation, military cargo, different warnings, company and captain speed decisions, inquiry findings, explosion controversy, and the two years before American entry. The depth pass adds adjoining-compartment flooding and the actual propaganda medal, including its erroneous date. The voice pass revises twenty passages and removes the universal sacrifice template.

The evidence pass corrects the false claim that Mersey blamed Turner and records actual location-bearing warnings. It distinguishes contemporary acknowledgment of ammunition from later wreck discoveries and both inquiries’ two-torpedo explanations from modern accounts. Preston’s rejection of a deliberate British sacrifice remains alongside her allegation that officials managed the later evidence and explanation. Hazlehurst’s own reproduction is identified as the route to the Runciman letter, without pretending to inspect the original archive. The final pass adds the actual parliamentary naval-use answer and the official Bryan account and removes the invented banker-command framing. Both connection reasons revised; the broad financial relationship is flagged. Stale narration withheld.

**Progress:** 42 of 198 rewritten; 156 remain. Next in reading order: `pearl-harbor-foreknowledge`. Metadata/link/review/audio validation passes for all 42. The production build through 42 passed, including generated and compiled Lusitania source sections. The writing skill remains unchanged during this follow-up.


### Pearl Harbor foreknowledge checkpoint

Rewrote `pearl-harbor-foreknowledge` to 3104 essay words and completed all three reviews. The essay follows what information existed, when it was readable, and who received it. It develops the actual war warnings and unresolved sabotage reply, McCollum’s recommendations, Stimson’s diary and defensive instructions, the berthing requests, translation dates, the Sunday deadline and communications failure, local submarine/radar reports, and later findings. The depth pass adds Knox’s caution, Richardson’s basing objections, and unequal warning distribution within Hawaii. The voice pass revises twenty-four passages.

The evidence review uses the relevant primary inquiry sections, the complete McCollum transcription and comment, Parker’s official PDF and selected reproduced intercepts, Stinnett’s own explanation, the NPS radar account, and the actual 2000 statutory section. It corrects the fleet-deployment chronology, conflation of diplomatic and naval systems, 1941 transmission versus postwar translation, omission of the defensive instructions, merger of the diplomatic reply with its delivery instruction, the account of who chose commercial transmission, the carriers’ single-evacuation story, and the differing inquiry judgments. The full Navy carrier-location page was unavailable; the official published search record supports Saratoga’s San Diego arrival and the primary inquiry supplies the other carrier missions. Full books, original Yale diary, all inquiry volumes, and every original intercept are not represented as read. All five reasons revised and weak later-event lineage flagged. Stale narration withheld.

**Progress:** 43 of 198 rewritten; 155 remain. Next in reading order: `business-plot`. Metadata/link/review/audio validation passes for all 43. The production build through 43 passed, including generated and compiled Pearl Harbor source sections. The writing skill remains unchanged during this follow-up.


### Business Plot checkpoint

Rewrote `business-plot` to 3282 essay words and completed all three reviews. The essay separates the funded 1933 gold campaign from the reported August 1934 authoritarian proposal, follows French’s separate interview, explains the financial checks and European letters, and retains both the committee’s positive finding and its qualification about corroboration. The depth pass develops the gold/bonus conflict, bank tracing, and the veterans’ consent. Nineteen voice revisions remove repetitive editorial scaffolding. The evidence pass corrects the original chronology, scene, witness arrangement, funding claims, proven-organizer list, and publication history; it also corrects the draft’s Frew name, separates the post-convention sound-money fund, and attributes claimed cash repayment accurately.

Sources examined include the complete public statement, Butler and French testimony, selected original hearing scans, the relevant final-report pages, and relevant contemporary Spivak and Time passages. The original scan corrects a later transcription error: $31,000, not $81,000. Restored Spivak passages are identified rather than represented as part of the originally published hearing. Full MacGuire testimony, every exhibit, all Spivak articles, the complete Time middle section, later books, and the inaccessible FBI file are not represented as read. Six reasons revised; unsupported Skull and Bones/Paperclip lineage flagged. Stale narration withheld.

**Progress:** 44 of 198 rewritten; 154 remain. Next in reading order: `operation-ajax`. Metadata/link/review/audio validation and the production build pass. Generated and compiled source-section structure checked. The writing skill remains unchanged during this follow-up.


### Operation Ajax checkpoint

Rewrote `operation-ajax` to 3303 essay words and completed all three reviews. The account follows the nationalization dispute, Iranian coalition and constitutional conflict, contemporary assessment of Tudeh, Anglo-American planning, propaganda, first failure, conflicting instructions, August 19, and the negotiated aftermath. The depth pass develops command control, the actual budget distinctions, and the Shah’s calculation about Mossadegh’s sentence. Eighteen voice revisions remove repeated editorial framing and the later-coup parade. The final evidence pass corrects approval documentation, competing arrest accounts, legal ownership versus operating control, and leak versus official declassification.

Read the relevant primary UN address and constitutional provisions; Wilber summary, selected narrative, and relevant operational-plan sections; the specified FRUS records and policy/estimate passages; and the Archive’s publication accounts. The full Wilber narrative, all FRUS records, original microfilms, complete later books, torture allegations, and inaccessible full Albright speech are not represented as read. All nine reasons revised; unsupported drugs, petrodollar, and Gladio lineage flagged. Stale narration withheld.

**Progress:** 45 of 198 rewritten; 153 remain. Next in reading order: `bay-of-pigs`. Metadata/link/review/audio validation and the production build pass. Generated and compiled source-section structure checked. The writing skill remains unchanged during this follow-up.


### Bay of Pigs checkpoint

Rewrote `bay-of-pigs` to 2981 essay words and completed all three reviews. The essay follows the original cadres program, its expansion, the political purpose of a beachhead, exile leaders’ exclusion, the change of landing site, air-support restrictions, ships/radios/ammunition, the unmade convoy request, and competing inquiries. The depth pass adds the political mechanism and Cuban leaders’ actual treatment. Seventeen voice revisions remove editorial scaffolding and the later-scandal catalogue. The evidence review corrects chronology, Cabell’s distinct appeals, the extent of continuing air attacks, Houston’s grounding, the early final bombers with undetermined cause, the inquiries’ different scopes, and the actual NSAM 57 allocation.

Read the complete Taylor narrative and cause/conclusion sections; selected Kirkpatrick original sections and full conclusions/recommendations; Bissell’s relevant summary; Cabell/Stevenson records; the responsibility directive, specified later covert-action/Mongoose records, and agency accounts of the dead airmen and returned prisoners. Full IG/rebuttal, all annexes, memoirs, later networks, and original speech audio are not represented as read. Eight reasons revised, with unsupported collective-brigade lineage flagged. Stale narration withheld.

**Progress:** 46 of 198 rewritten; 152 remain. Next in reading order: `operation-gladio`. Metadata/link/review/audio validation and the production build pass. Generated and compiled source-section structure checked. The writing skill remains unchanged during this follow-up.


### Operation Gladio checkpoint

Rewrote `operation-gladio` to 2965 essay words and completed all three reviews. The account follows the actual caches, recruitment, bilateral and allied arrangements, proposed peacetime counterinsurgency, 1972 retrenchment, later local information collection, Peteano evidence, selective political briefings, P2, and the Italian/Belgian inquiries. The depth pass develops historical membership and the legal/oversight mechanism. Twenty-two voice revisions replace broad claims and recurring editorial caveats with decisions and documents. The evidence pass preserves the critical Italian interpretation and dissent, Belgium’s unestablished terrorism link and blocked confidential check, and the later final acquittal concerning records.

Read the specified main Italian report and dissent sections, actual 1995 Aurisina/Peteano material and selected P2/records passages, relevant Belgian findings and obstruction passages, the full European resolution, the official Peteano memorial, judgment opening and operative conclusions, and the later official confirmation of finality. Entire national case files, books, the whole Belgian report and court bundle are not represented as read. All fifteen reasons revised; unsupported assassination, Vatican, media-suppression and common-command links flagged for graph review. Stale narration withheld.

**Progress:** 47 of 198 rewritten; 151 remain. Next in reading order: `operation-condor`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Gladio source sections. The writing skill remains unchanged during this follow-up.


### Operation Condor checkpoint

Rewrote `operation-condor` to 2874 essay words and completed all three reviews. The account develops the founding arrangements, Orletti’s service structure and lease, the Gelman family’s transfer, Teseo plans, Townley’s actual documentation route, the CIA’s later Pinochet assessment, American knowledge and the withdrawn warning, Contreras liaison, archival corroboration, and the 2016 trial. The depth pass expands the continuing commitment, staffing and institutional incentives; twenty-three voice revisions remove spectacle and editorial repetition. Eleven final evidence/source revisions include the actual phases, founding membership, distinction between plans and missions, memo chronology, one CIA payment, later knowledge, and the scope of the criminal proceedings.

Read the specified original documents and complete released reports noted in the inventory, selected prosecutor/court passages, the complete trial summary and the official Paraguayan archival account. Full court case files, all service archives, and inherited books are not represented as read. All nine reasons revised, with unsupported common-command, debt-enforcement, Nazi/Paperclip, and drug-trafficking links flagged. Stale narration withheld.

**Progress:** 48 of 198 rewritten; 150 remain. Next in reading order: `phoenix-program`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Condor source sections. The writing skill remains unchanged during this follow-up.


### Phoenix checkpoint

Rewrote `phoenix-program` to 2808 essay words and completed all three reviews. The essay follows the actual coordination centers, organizational development, information quality, armed units, detention process, contested testimony, definitions behind the official figures, provincial successes/failures, and end of direct American support. The depth review develops safeguards and advisory responsibility, the Hau Nghia example, and control versus loyalty. Twenty voice revisions remove spectacle, repeated caveats, and the later-program catalogue. Eight evidence/source revisions and a final transition correction preserve attribution and the actual counterarguments.

Read the complete Phoenix chapter in Ahern’s agency history and selected later passages; specified 1973 hearing passages and written answers; and both actual FRUS documents. The hearing’s embedded text omitted major answers; the five final pages were OCRed and the statistics page inspected visually. This prevented treating Colby’s referral for updated figures as a refusal to answer the substantive accuracy questions. Earlier allegations, Defense’s disputed response, accepted specific Quaker evidence, documented abuses, and the risk language in the supportive PRU proposal remain distinct. Full case files, books, complete 1971/1973 hearings, and all Ahern chapters are not represented as read. Seven reasons revised; unsupported training, transport and later-template mechanisms flagged. Stale narration withheld.

**Progress:** 49 of 198 rewritten; 149 remain. Next in reading order: `uss-liberty`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Phoenix source sections. The writing skill remains unchanged during this follow-up.


### USS Liberty checkpoint

Rewrote `uss-liberty` to 3208 essay words and completed all three reviews. The essay develops the missed withdrawal orders, actual attack and survival work, headquarters identification, failed caution to the boats, critical American assessments, Israeli no-trial reasoning, helicopter intercepts, American response, investigation limits, and survivors’ challenge. The depth review adds the public cover account and actual care and engineering work. Twenty-two voice revisions replace editorial scaffolding with people’s decisions and observations. Eleven evidence/source revisions and a link cleanup preserve the differences among the contemporary records and later allegations.

Read the specified NSA history sections and actual court records noted in the inventory, all fifty-two court findings, the four FRUS documents, all of Boston’s longer declaration and relevant Congressional Record material. Full case files, all court testimony and exhibits, original Israeli inquiry, every certified transcript version, original flight/recall logs and recordings, and inherited books are not represented as read. The published late recall does not decide allegations of an earlier one. Three graph reasons revised; unsupported common orchestration and suppressed-interception claims removed. Stale narration withheld.

**Progress:** 50 of 198 rewritten; 148 remain. Next in reading order: `iran-contra`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Liberty source sections. The writing skill remains unchanged during this follow-up.


### Iran-Contra checkpoint

Rewrote `iran-contra` to 3347 essay words and completed all three reviews. The essay follows the duplicate Defex company through official policy, changing aid restrictions, suppliers’ control, the hostage bargain, separate presidential findings, proposed and actual financial flows, exposure, evidence destruction, the inquiries, classified material, immunity and pardons. The depth review develops the proposed CIA acquisition of assets and the untried central charge. Twenty-four voice revisions remove repeated editorial framing and speculative later-scandal genealogy. Ten evidence/source revisions and a final definition preserve the actual financial categories and different kinds of responsibility.

Read the congressional majority summary and specified minority material, all of Walsh’s finance chapter, prosecution summary and specified legal/Bush passages; original findings, proposal, minutes and diary records; appellate passages, the actual pardon proclamation and relevant Kerry findings. Full report volumes, original financial exhibits, all criminal records and inherited books are not represented as read. Twelve graph reasons revised, with unsupported Federal Reserve, common-command and doctrinal-lineage claims flagged. Stale narration withheld.

**Progress:** 51 of 198 rewritten; 147 remain. Next in reading order: `operation-cyclone`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Iran-Contra source sections. The writing skill remains unchanged during this follow-up.


### Operation Cyclone checkpoint

Rewrote `operation-cyclone` to 2676 essay words and completed all three reviews. The essay follows the actual arms route, Afghan conflict, aid authorizations, Pakistani leverage, rival commanders, escalation, intelligence assessments, NSDD166, Stingers, withdrawal, later fighting, civilian relief and the different surviving networks. The depth pass develops direct contacts, the escalation alternative and continued assistance. Twenty-six voice revisions remove repeated trap imagery and editorial caveats. Seven evidence/source revisions and final consistency trims preserve the actual chronology and bounded causal claims.

Read the specified American and Soviet records, the complete directive, relevant institutional and congressional assessments, historical opium discussion, actual BCCI attribution and 9/11 Commission sections noted in the inventory. Full operational and financial records, every assessment/meeting, complete later reports, the original 1998 interview and inherited books are not represented as read. The actual December 1979 memo is cautious about a Soviet Vietnam; pre-Stinger withdrawal discussions and 1990s buybacks are retained. Eight reasons revised; unsupported institutional control, shared-banking and direct organizational genealogy flagged. Stale narration withheld.

**Progress:** 52 of 198 rewritten; 146 remain. Next in reading order: `operation-glasnost`. Metadata/link/review/audio validation and the production build pass, including generated and compiled Cyclone source sections. The writing skill remains unchanged during this follow-up.


### Operation Glasnost checkpoint

Rewrote `operation-glasnost` to 3556 essay words and completed three substantive reviews. The essay follows recorded diplomacy and the competing authorities of 1990–91, with room to explain external pressure, economic leverage, reform, the coup, common institutions and Ukrainian independence. The depth review develops nuclear and economic stakes, public/private American policy, signature and ratification, and assurances versus treaty provisions. Twenty-eight voice revisions and sixteen evidence/consistency revisions, followed by a sourced advisory-case expansion, replace the invented scene and repeated suspicions with decisions the reader can follow.

Read the specified complete directives and private records, parliamentary appeal and treaty provisions recorded in the inventory. The Harvard paragraph uses the official recovery summary and the retrieved USAID article excerpt; the full USAID issue, court file and settlement were not inspected. No claim is made to have read all operational archives, inherited books or the full American German-settlement meeting. Ten connection reasons corrected, weak institutional/biographical analogies flagged, and stale narration withheld.

**Progress:** 53 of 198 rewritten; 145 remain. Next in reading order: `rex-84`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Rex 84 checkpoint

Rewrote `rex-84` to 3040 essay words and completed three reviews. The essay follows the actual hearing and release, Giuffrida’s argument, the incarceration precedent, emergency orders, succession, interagency disagreements, post-2001 continuity and later court/surveillance claims. Depth revisions explain what exercises test, the privacy redactions and legal succession. Twenty-nine voice changes and nine evidence/consistency changes, followed by a plain-language standing explanation and final trims, keep the account concrete and the qualifications proportional.

A major correction comes from the original thesis: the twenty-one-million figure is a calculation of an extremely unlikely and enormous task, not a recommendation to imprison that population. Its smaller detention scenario, coercive assumptions and final advocacy of racial equality are explained together. The hearing is dated July 13, 1987, and does not name Rex 84 or contain North’s confirmation of the allegation. Released records acknowledge the exercise and document disagreements over FEMA’s role. Chardy’s account remains attributed; the original Smith/Brinkerhoff documents and complete exercise plan were not inspected. More precise source limits appear in the inventory. Four graph reasons corrected, the weak Contra personnel link flagged, and stale narration withheld.

**Progress:** 54 of 198 rewritten; 144 remain. Next in reading order: `watergate`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Watergate checkpoint

Rewrote `watergate` to 3123 essay words and completed three reviews. The account follows the campaign operation into false testimony, payments, clemency discussions, intelligence pressure, independent investigation, judicial access to tapes, resignation and pardon. Depth revisions develop the continuing obligations created by silence and the actual expectations and reporting relationships inside the FBI and CIA. Twenty-three voice revisions and eight evidence/consistency changes replace repeated caveats with concrete decisions and their consequences.

The essay corrects claims about the Fielding burglary, Cuban participants, the Bay of Pigs phrase, the decisive tape lawsuit and the impeachment subpoenas. It explains the CIA’s actual assistance, delayed disclosure and destroyed records alongside the commission’s findings and inability to obtain all requested Nixon papers. Published transcript excerpts, inspected portions of the appellate opinion and commission chapter, the Supreme Court syllabus, official histories, presidential statements and prosecution memorandum support the account; exact source limits appear in the inventory. Eight connection reasons corrected, weak associations flagged, stale narration withheld.

**Progress:** 55 of 198 rewritten; 143 remain. Next in reading order: `iraq-wmds`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Iraq WMDs and PNAC checkpoint

Rewrote `iraq-wmds` to 2999 essay words and completed three reviews. The account follows prior advocacy into the estimate, technical disagreements, source failures, document authentication, inspections, policy presentation and postwar findings. Depth revisions explain daily briefing formats, the limits of dual-use indicators and the Survey Group’s methods. Thirty-three voice revisions and nine evidence/consistency changes keep the account concrete and avoid treating different errors as one undifferentiated operation.

Important corrections include Energy’s distinction between the tubes and overall nuclear judgment, Powell’s actual acknowledgment of the tubes dispute, the different chemical/nuclear and biological chronologies, and the lack of established INC direction of Curveball. The July 23 record is examined alongside the later disagreement over its wording. The Senate report’s majority findings and minority objections, and the WMD Commission’s limited remit, are identified. The Times acknowledgment is supported by an inspected excerpt rather than a claim to have read the unavailable full note. Exact source limits are recorded in the inventory. Eleven graph reasons corrected, weak associations flagged, stale narration withheld.

**Progress:** 56 of 198 rewritten; 142 remain. Next in reading order: `deep-state`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Deep State checkpoint

Rewrote `deep-state` to 2863 essay words and completed three reviews. The essay distinguishes criminal-official networks, professional continuity, secrecy, elected executive direction, surveillance failures and private influence. Depth revisions explain access to classification review, causes of policy continuity and the documentary basis for the financial device. Thirty-nine voice revisions and ten evidence/consistency changes replace repeated assertions about a hidden structure with specific people, papers and decisions.

The Susurluk account follows the actual ECHR record and separates an unproved killing allegation from a proved investigative failure. The Iran finding places Reagan within the arms initiative, and the Page section includes both the inspector general’s bounded findings and Clinesmith’s admitted email alteration. OPM’s actual SES scope, GAO’s defined employment sample and the classification framework replace sweeping workforce, contractor and secrecy claims. Exact inspected passages and source limits appear in the inventory. A further four revisions make continuity and the civil-service section more specific, including actual limited appointment durations. All forty-one reasons corrected; numerous weak associative edges flagged without changing target order. Stale narration withheld.

**Progress:** 57 of 198 rewritten; 141 remain. Next in reading order: `shadow-elite`. Metadata/link/review/audio validation and the refreshed production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Shadow Elite checkpoint

Rewrote `shadow-elite` to 2759 essay words and completed three reviews. The essay follows the Harvard Russia advisory case, differentiated responsibility, overlapping roles, the banking-reform fight, private access and the Trilateral participation dispute. Depth revisions explain market infrastructure, licensing and summary judgment. Thirty-eight voice revisions and seven evidence/consistency changes replace a catalogue of clubs and repeated caveats with documents, transactions and decisions.

The court’s civil findings, Harvard’s own characterization and the recovery totals remain distinct. An original-edition Quigley scan replaces an edited transcription; printed949–952 were inspected, not his underlying network papers. The Trilateral publication records dissent from the less-democracy prescription. Exact inspected passages and source limits appear in the inventory. All forty-two reasons corrected, weak associative edges flagged, stale narration withheld.

**Progress:** 58 of 198 rewritten; 140 remain. Next in reading order: `control-systems`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Invisible Control Systems checkpoint

Rewrote `control-systems` to 2991 essay words and completed three reviews. The essay follows concealed sponsorship, indirect knowledge, trusted intermediaries, news selection and actual feed experiments. Depth additions develop the cost of verification, hypothetical funding choices and the relation between disclosure and choice. Thirty-three voice changes and twelve evidence/consistency changes remove sweeping all-purpose control claims and repeated caveats.

The FTC complaint and settlement remain distinct from an experiment on buyers. Lippmann’s proposed independent inquiry is restored, and Bernays’s own admitted limits remain beside his techniques. The 2023 Meta findings are bounded to the election-period comparison and author-hosted abstract; the full paper and later correction details were not inspected. The 2026 X article’s design and discussion distinguish exposure, opinion, party identity and possible persistence. Exact source limits are in the inventory. Thirty reasons corrected, weak associative links flagged, stale narration withheld.

**Progress:** 59 of 198 rewritten; 139 remain. Next in reading order: `federal-reserve`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Federal Reserve checkpoint

Rewrote `federal-reserve` to 3172 essay words and completed three reviews. The essay follows private design and public legislation, governance, a worked deposit/loan example, reserve settlement, rate implementation, bond purchases, crisis assistance and oversight. Depth revisions explain liquidity versus solvency, the value of access, disclosure timing and the changed emergency authority. Thirty voice revisions and twelve evidence/consistency revisions, followed by two precision trims, replace invented scenes and repeated verdicts with mechanisms and decisions.

The dividend rule, appointments, director classes and policy votes are distinguished. GAO’s transaction total is separated from peak outstanding lending, subsidy and a gift; its actual criticisms and bounded negative findings are both retained. The Fed is audited, with statutory limits and exceptions on GAO’s policy review. Source limits are recorded in the inventory, including selected histories, the UK lending explanation, the2024 Code edition, partial2011 GAO inspection and selected2025 statements. Eighteen reasons corrected, weak associative links flagged, stale narration withheld.

**Progress:** 60 of 198 rewritten; 138 remain. Next in reading order: `money-as-debt`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Money as Debt checkpoint

Rewrote `money-as-debt` to 2921 essay words and completed three reviews. The essay follows the observed loan, separate obligations, payment settlement, capital and funding, reserve requirements, interest circulation, genuine debt distress and reform proposals. Depth revisions explain real resources, complete the bank’s entries and examine transition financing. Twenty-six voice changes and ten evidence/consistency changes, plus a final non-loan-origin addition and duplicate trim, remove repeated verdicts and clarify the actual mechanics.

The four-step interest table demonstrates possibility without guaranteeing every debtor sufficient income. Write-offs and repayments are separated, Fisher’s feedback is conditional, and zero required reserves does not mean limitless lending. Werner’s observations and Chicago Plan simulations are attributed with exact inspection limits, and the2018 Swiss result is checked. Eight reasons corrected, weak associative links flagged, stale narration withheld.

**Progress:** 61 of 198 rewritten; 137 remain. Next in reading order: `petrodollar`. Metadata/link/review/audio validation and the production build passed; generated and compiled Sources structure checked. The writing skill remains unchanged during this follow-up.


### Petrodollar checkpoint

Rewrote `petrodollar` to 2793 essay words and completed three editorial reviews. Oil invoicing, payment, investment and official reserves are developed separately, with a four-part table and worked exchange-rate and dollar-debt examples. The diplomatic planning, Saudi-funded projects and Treasury investment facility are explained through distinct records.

The1979 public GAO account corrects the claim that the entire investment mechanism remained unknown until2016. Country-level disclosure and investigative access were genuinely contested. The rewrite distinguishes Treasury’s privacy defense from GAO’s criticism, average-price access from off-the-books transactions, Swift messages from settlement, and the documented Iraq euro switch from an unestablished war motive. The2024 reserve figure is explicitly dated. Twenty-seven voice changes, ten consistency changes and eight final trims were reread. Exact source-inspection limits are recorded in the inventory.

All seven connection reasons corrected; weak currency-lineage and unified-reset associations flagged. Old narration withheld. **Progress:** 62 of198 rewritten;136 remain. Next: `economic-hitman`. Metadata/link/review/audio validation passed for62 nodes. Both local detector checks completed; the production build completed through OpenNext, and generated and compiled table and Sources structure were verified. These checks do not establish authorship or editorial quality. The skill remains unchanged.


### Economic Hit Men checkpoint

Rewrote `economic-hitman` to 2794 essay words after three substantive passes. The essay explains a hypothetical power project’s costs, receipts, public guarantee and exchange exposure, then develops forecast incentives, conditional lending and actual Greece and Nepal decisions. The depth pass adds compounding, feasible alternatives and two-sided bargaining constraints. Eighteen voice changes replace mechanical cautions and checklist questions. Eight evidence revisions and two final corrections align the borrower, guarantee, procurement scope, Greek chronology and revised Nepal safeguards.

Perkins’s own preface is represented more fairly: shared incentives coexist with allegations of deliberate acts. The story’s setting does not independently verify his private role or allegations about particular deaths. The cited institutional criticisms and defenses receive concrete treatment, with exact inspection limits in the inventory. Eight outgoing reasons corrected, weak links flagged, old narration withheld. **Progress:** 63 of198 rewritten;135 remain. Next: `military-industrial-complex`. Metadata/link/review/audio validation passed for63 nodes. Both local detector checks completed; production build completed through OpenNext and generated and compiled Sources structure was verified. These checks do not establish authorship or editorial quality. The skill remains unchanged.


### Military-Industrial Complex checkpoint

Rewrote `military-industrial-complex` to 2618 essay words after three editorial passes. The essay follows requirements, contract terms, performance targets, employment interests, supplier dependence and the ability to change course. The depth pass adds original requirement, maintenance and sunk-cost examples. Nineteen voice changes replace broad declarations and repeated cautions with choices and consequences; eight consistency revisions and a final status trim were reread.

Corrected the automatic-profit account of cost-plus-fixed-fee contracts with a checked table. The June2026 F35 readiness/incentive review and November9,2026 parts review are dated and scoped; audit disclaimers are separated from no audit and quantified theft. Druyun’s admitted conflict is distinguished from a count of legal employment moves, and the combined615million settlement is not assigned to a single deal. FARA closeout supplies an actual counterexample to universal continuation. Source-inspection limits are recorded in the inventory. Six reasons corrected, weak causal associations flagged, stale narration withheld. **Progress:** 64 of198 rewritten;134 remain. Next: `shock-doctrine`. Metadata/link/review/audio validation passed for64 nodes. Both local checks completed on the final revised text; production build64b completed through OpenNext. Generated and compiled table, revised inventory example and Sources structure were verified. These checks do not establish authorship or editorial quality. The skill remains unchanged.


Military essay follow-up: local-check review prompted rereading, followed by four paragraph revisions to the merger, maintenance, workforce and audit explanations. Added a clearly hypothetical100/90inventory reconciliation; no amount is claimed stolen. Final essay length: 2631 words. Production build64b, both repeated local checks and generated/compiled verification passed for this revision.


### Shock Doctrine checkpoint

Rewrote `shock-doctrine` to 2554 essay words and completed three reviews. The essay examines emergency policy through Friedman’s Chile advice and New Orleans’s school changes. Depth work explains competing accounts of changed public opinion, actual local-governance changes, an original comparison-group example and emergency repair versus a long concession. Nineteen voice changes, eight consistency changes, three duplicate trims and a final pronoun correction were reread.

Corrected the chronology: Act35took effect November30,2005; Friedman’s voucher article appeared December5and advocated a different arrangement from charter contracting. The letter is explicitly an inspected excerpt, not a fully read archive. Academic improvements are represented alongside workforce and participation concerns, and2018methods are explained without claiming randomized proof or identifying every separate reform’s effect. Outcome and authority remain distinct standards. All six reasons corrected, weak universal analogies flagged, stale narration withheld. **Progress:** 65 of198 rewritten;133 remain. Next: `bernays`. Metadata/link/review/audio validation passed for65 nodes. Both local detector checks completed; production build65 completed through OpenNext, and generated and compiled Sources and comparison example were verified. These checks do not establish authorship or editorial quality. The skill remains unchanged.


### Bernays checkpoint

Rewrote `bernays` to 2530 essay words after three reviews. The essay follows a message through intermediaries, events and news; distinguishes an advocate’s claim from measured effects; and gives the democratic and ethical defenses fair treatment. Depth additions address genuine social motives and changes to client conduct. Nineteen voice revisions, eight evidence revisions and final duplicate/consistency edits were reread.

The1918cataloginsert supplies a concrete distribution record. The Torches photograph metadata establishes a campaign connection, while Murphree’s own research discussion challenges overconfident histories; no doubling-of-sales claim remains. The1928source and1947essay are distinguished from the later edited volume. DorisFleischman’s partnership is acknowledged, source disclosure to editors is distinguished from audience disclosure, and UnitedFruit’s archive record is not treated as a full coup history. Precise source-inspection limits are recorded in the inventory. Twelve reasons corrected, weak lineages flagged, stale narration withheld. **Progress:** 66 of198 rewritten;132 remain. Next: `tavistock`. Metadata/link/review/audio validation passed for66 nodes. Both local detector checks completed; production build66 completed through OpenNext. Generated and compiled Sources structure, revised opening and partnership acknowledgment were verified. These checks do not establish authorship or editorial quality. The skill remains unchanged.


Bernays follow-up: targeted local-check rereading revised three paragraphs on event preparation, deliberate social preferences and the audience’s right to know who arranged an appeal. Final length: 2515 essay words. Production build66b and repeated local checks completed; generated and compiled final ending and Sources structure were verified. Detector outputs disagree and are recorded as heuristic readings, not authorship judgments.


### Tavistock checkpoint

Rewrote `tavistock` to 2586 essay words after three actual reviews. The essay follows authority through the coal study, group conferences, Rees’s1940address and a client’s brief. Depth additions explain task coordination, study methods, evaluation alternatives and interpretation that remains open to challenge. Twenty-one voice revisions and eight consistency revisions were followed by rereading and final grammar/paragraph edits.

Corrected incorporation to20September1947and separated the Institute from the Clinic and related bodies. Rees’s concealed-influence proposals are criticized in context, with the source correctly dated1940rather than1945. Worker contributions and selective settings are restored to the coal-study account; proposals are not represented as completed causal trials. The2025financial review establishes reported commercial pressures without alleging corruption. Exact source-inspection limits are recorded in the inventory. All nine reasons corrected and weak operational associations flagged; stale narration withheld. **Progress:** 67 of198 rewritten;131 remain. Next: `manufacturing-consent`. Metadata/link/review/audio validation passed for67nodes. Both local detector checks completed; production build67completed through OpenNext. Generated and compiled Sources structure, revised opening and financial-review passage were verified. These checks do not establish authorship or editorial quality. The writing skill remains unchanged.


### Manufacturing Consent checkpoint

Rewrote `manufacturing-consent` to 2706 essay words after three actual reviews. Explained the original five filters through one worked, explicitly imaginary newsroom example and developed a real study’s methods. Depth revisions add job-estimate scrutiny, local scope limits, decision-making without majority persuasion and funding protections. Seventeen voice revisions and eight evidence/consistency revisions were reread. Bennett’s abstract coding and persistent opposing columnists are represented; Okrent’s public-editor assessment is distinguished from a universal verdict. Audience effects, direct covert activity and algorithmic distribution remain separate questions. Removed unverified ownership/circulation claims, documentary timestamps and total-control conclusions. Exact source-inspection limits are recorded in the inventory.

All 7 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 68 of198 rewritten;130 remain. Next: `predictive-programming`. Metadata/link/review/audio validation passed for68nodes. Both local detector checks completed; production build68completed through OpenNext. Generated and compiled Sources structure, study count and final funding passage were verified. These checks do not establish authorship or editorial quality. The writing skill remains unchanged.


Manufacturing Consent follow-up: rereading after the local checks combined two repetitive indexing paragraphs and made the counterevidence test concrete through the hypothetical development story. Final length: 2713 words. Repeated local checks completed; build68bcompleted through OpenNext. Generated and compiled final counterevidence passage and Sources structure were verified. The detector signals disagree in magnitude and are treated as heuristics.


### Predictive Programming checkpoint

Rewrote `predictive-programming` to 2516 essay words after three actual reviews. Separated a resemblance from the proposed chain of sponsorship, advance knowledge, exposure and response. Depth revisions explain unseen background details, a stronger response-framing argument and a hypothetical randomized comparison. Eighteen voice revisions and eight consistency revisions were followed by rereading and a final conjunction clarification. The pilot’s plane/WTC premise is established through a2026directinterview, while uninspected full-episode details are not claimed verified. Corrected the inherited passage treating fictional government orchestration as part of actual9/11history. Armyassistance procedures establish real leverage over supported productions; they do not establish universal future-event placements. The memory finding is explicitly an abstract-level knowledge-test result. Event201’s scenario, nonprediction statement and actual communications recommendation are examined separately from any claim about causing an outbreak. Exact source-inspection limits are recorded in the inventory.

All 9 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 69 of198 rewritten;129 remain. Next: `counterculture-psyop`. Metadata/link/review/audio validation passed for69nodes. Both local detector checks completed; production build69completed through OpenNext. Generated and compiled Sources structure, probability example and corrected retrospective date were verified. These checks do not establish authorship or editorial quality. The writing skill remains unchanged.


### Counterculture as Psyop checkpoint

Rewrote `counterculture-psyop` to 2549 essay words after three actual reviews. The essay begins with the FBI’s actual concern about coffeehouses near military bases and examines disruption, surveillance, drug research and cultural marketing as distinct activities. Depth work develops family/employer pressure, the Bureau’s vague categories, Kesey’s own interpretation and the stronger containment counterfactual. Twenty-two voice edits, eight consistency/depth edits and final rereading corrected an unintroduced pronoun and removed a question chain. Restored LSD’s1938Sandozorigin, attributed Kesey’s sponsorship/access recollection, and used Gallup’s actual all-adult mistake-question series rather than an invented1967majority or a drug-usercausalclaim. Continued opposition does not by itself settle how effective organizing might otherwise have been. Family relationships and commercial images do not establish operational authority. Exact source-inspection limits and the unresolved NewLeftinitiation-date discrepancy are recorded in the inventory; the essay uses only the year1968.

All 18 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 70 of198 rewritten;128 remain. Next: `color-revolutions`. Metadata/link/review/audio validation passed for70nodes. Both local detector checks completed; production build70completed through OpenNext. Generated and compiled Sources structure, restored Kesey introduction and poll-wording passage were verified. These checks do not establish authorship or editorial quality. The writing skill remains unchanged.


### Color Revolutions checkpoint

Rewrote `color-revolutions` to 2703 essay words after three actual reviews. Following Georgia’s reported1to1001protocolchange, the essay distinguishes actual election misconduct, foreign grants and authority over recipients. Depth review develops mixed elections, partial annulment, a worked tally comparison and practical organizing constraints. Seventeen voice revisions remove mechanical caution and a question chain; final consistency pass restores2010date, defines protocol and bounds the2004grantchronology. Ukraine’s court ordered a repeat vote rather than appointing an exitpollwinner; its later complaint procedure is also criticized. Sharp’s noncooperation and documented tactical diffusion are distinct from branding or universal command. Source inspections and limits are in the inventory. End follows the same electorate’s right to challenge a wrong count and hold replacement leaders accountable.

All 7 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 71 of198 rewritten;127 remain. Next: `frankfurt-school`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Color Revolutions verification: all71rewritten nodes pass metadata, graph-order, wiki-target, three-review, wordcount and stale-audio checks. Production build71 completed through OpenNext; generated and compiled ColorRevolutions contain the revised1,001vote example,42296grant,2010discussion and Sources styling. Both local detectors completed on essaybody only (RoBERTa weighted0.0459,Desklib0.0126); heuristic scores are not authorship verification. No text sent to remote detection services. Skill hash unchanged. **Progress:71of198;127remain. Next:`frankfurt-school`.**


### The Frankfurt School & The Culture Industry checkpoint

Rewrote `frankfurt-school` to 2625 essay words after three actual reviews. The rewrite follows a hypothetical film commission through the culture-industry argument, leisure, audience judgment and the authority claimed by a critic. Adorno’s provisional royalweddingstudy complicates a passiveaudience picture; his concession about effectsevidence remains visible. Horkheimer’s postscript still calls for economic analysis. Marcuse’s actual partisan restrictions on speech/assembly are criticized without disguising them or inventing implementation. Lind’s2000speech is used as a primary account of his theory, not proof of its lineage. Depth review develops commercial dissent and differences of authority;24voiceedits and5consistency/finalvoiceedits are followed by rereading. Unverifiedhouse-scene,archive-exhaustion,1969incidentconflation and unsourced contemporarylineages removed. Source limits are recorded in inventory.

All 5 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 72 of198 rewritten;126 remain. Next: `hypernormalisation`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


FrankfurtSchool verification: all72rewritten nodes pass metadata, graph-order, wiki-target, review, wordcount and stale-audio checks. Production build72 completed through OpenNext; generated/compiled text contains PrincessBeatrix, the protestsong test, actualpublic-services restriction and Sources styling. Both local essaybody detectors completed (RoBERTa0.0244,Desklib0.0285); these are heuristic scores, not authorship verification. No remote essay submission or skill change. **Progress:72of198;126remain. Next:`hypernormalisation`.**


### HyperNormalisation checkpoint

Rewrote `hypernormalisation` to 2603 essay words after three actual reviews. The essay starts with Inna’s recollection of already-known poems appearing unexpectedly in officialpublication, then explains what institutional rituals do. Corrects the inherited claim that Yurchak simply meant everyoneknewitwasfake and the claim that he never exploredWestcomparisons. Actual1975financingchronology, mixedpublicofficial/appointedoversight and Ford’sconditionalchange retainpoliticswithinfinancialconstraint. Depth followup adds Sgaglione’s successfulchallenge to mandatorypensioninvestment, bounded todiscretionnotallrescue orbondvalue. Barlow’s demandforfreedom is separatedfrompredictionofunenforceablegovernmentpower. Twentyvoiceedits/threeconsistencyeditsfollowedbyrereading; newcourtparagraphs reviewedagain. Fullfilmnotwatched:selectedunofficialtranscriptanddirectCurtisinterviewareaccuratelylabelled; no inventedmontageanalysis/timestamps. Source limits ininventory.

All 6 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 73 of198 rewritten;125 remain. Next: `secret-societies`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


HyperNormalisation verification: all73rewritten nodes pass metadata, graph-order, wiki-target, review, wordcount and stale-audio checks. Production build73 completed through OpenNext; generated and compiled essay includes Inna, Sgaglione, Nov26,1975 and Sources styling. Both local essaybody detectors completed (RoBERTa0.1541,Desklib0.0052); disagreement reinforces heuristic status, not authorship verification. No remote essay submission or skill change. **Progress:73of198;125remain. Next:`secret-societies`.**


### Secret Societies checkpoint

Rewrote `secret-societies` to 2429 essay words after three actual reviews. OpeningfollowsP2typewriterribbonandfinancialcrosschecks, then develops contactversuscoordination, ritualversusobligation, borrowedlineage andpublicresponsibility. Washington’sfull1798qualificationretained: doctrine/individualactivitydoesnotequal lodgesactingassocieties; Sept25unreadbookexplicit. UGLE1717/1813datesseparated. Fama’sChristianaspirationandpublishedrulesareclaims,notautomaticoperationalproof. P2reportauthentication/reliability/individualresponsibilitykeptdistinct; law1982dissolutiondoesnotclose1984inquiry. CurrentBilderbergtopics/participantpublicationandactualChathamHouseRulecorrectinheritedclosed-agenda/absolute-silenceclaims. Depthpassdevelopssurpriseversusconsent;24voiceeditsand5consistency/finalvoiceeditsfollowedbyrereading. All18reasonscorrectedandweakedgesflagged; scope/sourceinspectionlimitsininventory.

All 18 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 74 of198 rewritten;124 remain. Next: `pythagoras`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Secret Societies verification: all 74 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 74 completed through OpenNext; generated and compiled essay contains the typewriter ribbon, 1813 and September 25, with Sources styling. Both local essay body detectors completed (RoBERTa 0.1326, Desklib 0.0097); these are heuristic signals, not authorship verification. No remote essay submission or skill change. **Progress: 74 of 198; 124 remain. Next: `pythagoras`.**


### Pythagoras checkpoint

Rewrote `pythagoras` to 2752 essay words after three actual reviews. The rewrite follows a string relationship through the teacher’s reputation, the theorem and its attribution, incommensurability, Philolaus’ account of order, Aristotle’s criticism and Simmias’ proposal about a soul. Depth review adds number terminology and the actual premise of Socrates’ reply; 23 voice edits and nine evidence/consistency edits were followed by rereading, with a final tetractys sentence correction reviewed again. The proposed hammer/weight experiment fails a specific square-root tension test rather than being dismissed generically. Mathematical proofs are presented as worked explanations without assigning their invention to Pythagoras. Late disclosure variants, rival inheritance and cosmic-order claims remain distinct. Detailed source limits are recorded in the inventory.

All 9 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 75 of198 rewritten;123 remain. Next: `knights-templar`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Pythagoras verification: all 75 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 75 completed through OpenNext; generated and compiled text includes the silence, four-triangle proof, square root of two and Simmias, with Sources styling. Both local essay body detectors completed (RoBERTa 0.0348, Desklib 0.0494); these remain heuristic signals. No remote essay submission or skill change. **Progress: 75 of 198; 123 remain. Next: `knights-templar`.**


### The Knights Templar checkpoint

Rewrote `knights-templar` to 2642 essay words after three actual reviews. The essay starts with the Cressing barn and follows publicly held resources into a prosecution that could make defending the order dangerous. It explains the 1310 burnings and the meaning of relapse, keeps Chinon’s admissions/absolution distinct from acquittal, and follows papal suppression and property transfer separately. The depth pass develops conflicting proceedings, two idol depositions and actual accounting duties; 23 voice edits and eight consistency/evidence edits were followed by rereading. Original nine-year digging, encrypted-check invention, debt-cancellation certainty, Vatican concealment, curse and underground world-power claims removed. Religious warfare is neither romanticized nor used to excuse an unjust process. All six reasons corrected; detailed source limits and weak edges recorded in inventory.

All 6 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 76 of198 rewritten;122 remain. Next: `holy-grail`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Knights Templar verification: all 76 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 76 completed through OpenNext; generated and compiled essay contains Cressing Temple, the fifty-four brothers, Chinon and 1791, with Sources styling. Both local essay body detectors completed (RoBERTa 0.0529, Desklib 0.0393); these are heuristic signals, not authorship verification. No remote essay submission or skill change. **Progress: 76 of 198; 122 remain. Next: `holy-grail`.**


### The Holy Grail checkpoint

Rewrote `holy-grail` to 2546 essay words after three actual reviews. The rewrite follows Chrétien’s failed question, Wolfram’s life-preserving stone and Malory’s sacramental dish before examining Mary, the modern dossiers and the copyright dispute. Corrects two reductive inherited claims: Chrétien’s Grail is already associated with a host, and royal-blood word division has medieval precedents without supplying a genealogy. Depth adds the maiden’s consequences, Wolfram’s Christian source framing and Malory’s spiritual kinship;23voiceedits and8evidence/consistencyedits followed by rereading. Modern library custody is separated from independent attestation. Mary’s significance is developed without making it depend on marriage. All four reasons corrected; weak reception/geometry edges and precise source limits recorded in inventory.

All 4 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 77 of198 rewritten;121 remain. Next: `freemasonry`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Holy Grail verification: all 77 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 77 completed through OpenNext; generated and compiled essay contains Anfortas, Lovelich, Schidlof and Mary Magdalene, with Sources styling. Both local essay body detectors completed (RoBERTa 0.0313, Desklib 0.0063); these are heuristic signals. No remote essay submission or skill change. **Progress: 77 of 198; 121 remain. Next: `freemasonry`.**


### Freemasonry checkpoint

Rewrote `freemasonry` to 2429 essay words after three actual reviews. The rewrite starts with1723directions to assist an authenticated poorbrother and follows admission, ritual, degree versus office, Pike’s rival meanings, public prestige and P2’s actual credit leverage. Depth review adds membership asymmetry, honor/safety, differing ritual experiences and Rizzoli/Ambrosiano; final follow-up replaces abstract ceremony talk with Prichard’s actual candles and officer positions. Twenty voice changes and ten final evidence/consistency changes were followed by rereading. Historic rules are neither present-day universal claims nor proof of behavior. Pike’s adepts passage remains alongside his preface’s invitation to dissent. Broad murder/revolution/ancientlineage claims removed; all17reasons corrected with weak edges/source limits recorded in inventory.

All 17 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 78 of198 rewritten;120 remain. Next: `illuminati`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Freemasonry verification: all 78 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 78 completed through OpenNext; generated and compiled essay contains Prichard, Rizzoli, the honor/safety limit and Supreme Being, with Sources styling. Both local essay body detectors completed (RoBERTa 0.00194, Desklib 0.1319); the differing signals were reviewed alongside the text, not treated as authorship findings. The highest Desklib window covers the degree/office and ritual discussion already made concrete with the early catechism. No remote essay submission or skill change. **Progress: 78 of 198; 120 remain. Next: `illuminati`.**


### The Illuminati checkpoint

Rewrote `illuminati` to 2476 essay words after three actual reviews. The essay follows Bode’s archive concern into education, questionnaires, complaint channels, lodge recruitment and the transformation of ambitions into alleged revolutionary control. The three passes add the universal-family promise and Knigge’s misleading reassurance proposal, remove 19 voice problems and correct nine evidence/consistency issues plus Robison’s first introduction. Search date corrected to October 11–12, 1786; continued regional recruitment is separated from a claim of world control. All six reasons corrected and source limits recorded in the inventory.

All 6 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 79 of198 rewritten;119 remain. Next: `protocols-of-zion`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Illuminati verification: all 79 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 79 completed through OpenNext; generated and compiled essay contains Becker, Bode, Pawlowski and the corrected 1786 search date, with Sources styling. Both local essay body detectors completed (RoBERTa 0.11567, Desklib 0.03193). The highest RoBERTa window contains only the final 41 tokens; that closing passage was reread and retained on editorial grounds. The scores remain heuristic signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 79 of 198; 119 remain. Next: `protocols-of-zion`.**


### The Protocols of the Elders of Zion checkpoint

Rewrote `protocols-of-zion` to 2330 essay words after three actual reviews. Replaced the universal-template account with close comparisons of a loan calculation, publication tax and press imagery, the gap before the known 1903 publication, the limits and prejudices of the 1921 exposé, and Ford–Marshall’s actual retraction/withdrawal exchange. Depth adds changed speaker/context and independent book identification; 18 voice edits and nine evidence/consistency changes plus an antecedent correction were reread. Police authorship remains uncertain without weakening the demonstrated fabrication. All seven reasons corrected and source limits recorded in the inventory.

All 7 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 80 of198 rewritten;118 remain. Next: `skull-and-bones`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Protocols verification: all 80 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 80 completed through OpenNext; generated and compiled text contains Montesquieu, Marshall, Radziwill and the 300-page threshold, with Sources styling. Both local essay body detectors completed (RoBERTa 0.00920, Desklib 0.05388); the highest windows were reread as editorial signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 80 of 198; 118 remain. Next: `skull-and-bones`.**


### Skull and Bones checkpoint

Rewrote `skull-and-bones` to 2375 essay words after three actual reviews. The essay starts with the 1991 changed locks and follows selection, work, investment, private disclosure and public responsibility. Adds Hadden/Luce’s actual collaboration and treats Geronimo’s descendants as people with different wishes rather than symbols in a dynasty narrative. Twenty-five voice changes and eleven evidence/consistency changes plus two final follow-ups were reread. Corrects the 1918 letter’s discovery and source status, the actual 2010 dismissal and the absence of a proven permanent blackmail archive. All eight reasons corrected and source limits recorded in inventory.

All 8 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 81 of198 rewritten;117 remain. Next: `bohemian-grove`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Skull and Bones verification: all 81 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 81 completed through OpenNext; generated and compiled essay contains Gow, Draper, Mead and the specific §3002 discussion, with Sources styling. Both local essay body detectors completed (RoBERTa 0.02245, Desklib 0.09581); their highest windows were reread alongside the actual text, not treated as authorship findings. No remote essay submission or writing skill change. **Progress: 81 of 198; 117 remain. Next: `bohemian-grove`.**


### Bohemian Grove checkpoint

Rewrote `bohemian-grove` to 2317 essay words after three actual reviews. The rewrite follows a practical theatrical restriction in Garnett’s 1908 account, Field’s 1906 ruined-city drama, the later ceremony’s temporary reprieve, social research, Nixon’s recollection, actual atomic-project planning and the workers excluded from fellowship. Three reviews add historical and technical depth, make 22 voice revisions and correct twelve evidence/consistency issues plus a final briefing clarification, all reread. The 1942 meeting and 1986 employment judgment now have their actual participants, purposes and scope. All five reasons corrected and precise source limits recorded in inventory.

All 5 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 82 of198 rewritten;116 remain. Next: `bilderberg`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Bohemian Grove verification: all 82 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 82 completed through OpenNext; generated and compiled text contains Field, the 1906 context, S-1 and the actual employment-law discussion, with Sources styling. Both local essay body detectors completed (RoBERTa 0.14341, Desklib 0.08868). The highest windows cover the atomic-meeting distinction and worker/member discussion; these passages were reread with the underlying records and retained on editorial grounds. Scores remain heuristic signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 82 of 198; 116 remain. Next: `bilderberg`.**


### The Bilderberg Group checkpoint

Rewrote `bilderberg` to 2152 essay words after three actual reviews. The rewrite begins with Lynn Riley’s complaint and distinguishes hospitality registration, discussion anonymity and reasons for later public acts. Adds the 1964 Senate publication, precise 1954 topics, current invitation governance, the actual Chatham House rule and a worked 2026 topic example. Depth, 19 voice changes and nine evidence/consistency revisions plus a final repeated-introduction correction were reread. The archive guide is described as a guide, not as inspected minutes; private capacity is no blanket exemption from public responsibility. All 12 reasons corrected and source limits recorded in inventory.

All 12 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 83 of198 rewritten;115 remain. Next: `denver-airport`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Bilderberg verification: all 83 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 83 completed through OpenNext; generated and compiled text contains Riley, Javits and the 1993 registration case, with compiled Sources styling. Both local essay body detectors completed (RoBERTa 0.14757, Desklib 0.05430). The highest window covers the Senate record and invitation governance; it was reread against the cited material and retained on editorial grounds. Scores remain heuristic signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 83 of 198; 115 remain. Next: `denver-airport`.**


### Denver International Airport checkpoint

Rewrote `denver-airport` to 2292 essay words after three actual reviews. The rewrite follows the baggage decision and coordination problem, compares construction and financing costs, gives Tanguma’s religious and personal account of his murals, and separates commemoration from governing authority. Three reviews add a worked engineering example and clarify the cost of idle facilities; 22 voice changes and twelve evidence revisions plus final follow-ups were reread. Corrects the false absence of financial scrutiny, ungrounded military/bunker inferences, present mural placement and runway bearings. All five reasons reviewed with weak associations and source limits recorded in inventory.

All 5 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 84 of198 rewritten;114 remain. Next: `p2-banco-ambrosiano`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


Denver Airport verification: all 84 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 84 completed through OpenNext; generated and compiled essay contains Tanguma, the 65-bag specification, $4.822 billion and the dated 2028 return projection, with Sources styling. Both local essay body detectors completed (RoBERTa 0.02547, Desklib 0.14059). Highest windows cover the opening engineering explanation and the marker passage; these were reread alongside the sources and retained on editorial grounds. Scores remain heuristic signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 84 of 198; 114 remain. Next: `p2-banco-ambrosiano`.**


### P2, Banco Ambrosiano and Roberto Calvi checkpoint

Rewrote `p2-banco-ambrosiano` to 2539 essay words after three actual reviews. The rewrite follows the sponsorship letters and then explains roster authentication, unequal information within P2, credit leverage over Rizzoli, loan capitalization, rescue and settlement. The three reviews add group structure and a specific press example, make24voice revisions and twelve evidence changes plus final follow-ups, all reread. Corrects the raid/collapse chronology and distinguishes parliamentary findings, financial recovery and the murder finding from the acquittals of particular defendants. All seven reasons corrected and source limits recorded in inventory.

All 7 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 85 of198 rewritten;113 remain. Next: `pope-john-paul-i`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


### Pope John Paul I checkpoint

Rewrote `pope-john-paul-i` to 2155 essay words after three actual reviews. The rewrite begins with Luciani’s last public catechesis, gives his pastoral examples room to develop, and then compares the actual first announcement with later household accounts. Three reviews add the September 6 visit and timing distinction, make 22 voice revisions and eleven evidence corrections, all reread. Corrects the invented named book in the notice, unsupported final-night purge certainty, blanket medical and conspiracy claims, and beatification as criminal acquittal. All six reasons corrected and source limitations recorded in inventory.

All 6 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 86 of198 rewritten;112 remain. Next: `saturn-black-cube`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


P2 and John Paul I verification: all 86 rewritten nodes pass metadata, graph order, wiki target, review, word count and stale audio checks. Production build 86 completed through OpenNext after both installations and P2’s revised ending. Generated and compiled text contains Rizzoli, the May 25 settlement and prospective two-thirds recovery, and Marin, the September 6 audience and the coronary attribution, with Sources styling. Final body checks completed for both models: P2 RoBERTa 0.01711/Desklib 0.08636; John Paul I 0.14736/0.02947. P2’s generic conclusion was replaced with its specific financing relationship (final count 2,527 words). The remaining highest windows, including a 37-token final fragment and the pope’s public teaching, were reread and retained on editorial grounds. Scores are heuristic signals, not authorship findings. No remote essay submission or writing skill change. **Progress: 86 of 198; 112 remain. Next: `saturn-black-cube`.**


### Saturn and the Black Cube checkpoint

Rewrote `saturn-black-cube` to 2207 essay words after three actual reviews. The rewrite explains a real fluid-dynamics experiment, the cube’s hexagonal projection and the missing steps in treating that resemblance as a religious genealogy. It includes the newly reported southern decagon, Plato’s actual earth assignment, Agrippa’s numerical table and the contents and texts of religious objects. Three reviews add a deliberate-symbol-versus-inherited-symbol distinction, make 21 voice changes and nine evidence revisions, all reread. All seven reasons corrected, with weak associations and source limits recorded in inventory.

All 7 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 87 of198 rewritten;111 remain. Next: `thule-vril`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


### Thule and Vril checkpoint

Rewrote `thule-vril` to 2502 essay words after three actual reviews. The essay separates a documented racist political network from a literary force, Ley’s retrospective account and later writers’ source connections. Three reviews develop the novel’s social danger and the source chain, make 19 voice changes and ten evidence-pass corrections, followed by a reread and attribution cleanup. All eleven reasons corrected with weak associations and reading limits recorded.

All 11 outgoing reasons corrected; weak associations are flagged in the inventory. Stale narration withheld. **Progress:** 88 of198 rewritten;110 remain. Next: `scientology`. Metadata/link/review/audio validation, both local detector checks and production build are due. The writing skill remains unchanged.


### Verification through essay 88

Completed the production build after the final Saturn physics revision and the Thule rewrite (`/tmp/apeirron-rewrite-build-88.log`, exit 0). The content validator passes for all 198 nodes, including the 88 rewritten bodies, metadata, graph reasons, supported links, source headings, actual word counts, review records and withheld stale narration. Checked generated JSON and compiled essay pages for all ten nodes in batch 79–88; sources render with the expected compiled-page treatment. Checked the final Saturn laboratory passage and the new Thule body in both outputs. `git diff --check` passes. This is a local build and content verification, not a deployment or a new browser inspection.

Saturn finishes at 2,203 essay words. After reading the initial detector signal, revised the laboratory comparison around the actual 60-centimeter apparatus and the paper's stated dissipation limitation. The final local RoBERTa/Desklib weighted signals are 0.01667/0.18619. Read the strongest remaining signals in the laboratory, Agrippa and ritual passages; retained their specific explanation rather than changing accurate material to chase a score.

Thule finishes at 2,502 essay words. Its three reviews include a developed conditional-attribution example, 19 voice changes, ten evidence-pass revisions and a final attribution cleanup. Final local RoBERTa/Desklib signals are 0.03982/0.02938. Reread the strongest signals in the short closing window and opening/history passages; retained the concrete newspaper/magazine distinction and source-supported account. These scores are heuristic signals, not evidence of authorship. Essays stayed local and the writing skill's hash is unchanged.

Progress: **88 of 198 rewritten; 110 remain.** Next: `scientology`. Source-access limits for each node remain recorded in the inventory. The unrelated `default.profraw` modification is excluded from the editorial commit.
