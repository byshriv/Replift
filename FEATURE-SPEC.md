# Feature preservation contract

Updated: 2026-10-28. Requirements transcribed from the user's handoff; not a claim of implementation or testing. Use the source inventory to find demo differences. Clarify contradictory rules before changing behaviour.

## Logging and sets

- Log after the workout; no timers, rest timer or supersets.
- Set rows: weight, reps, menu, check. Check faint until ticked; ticked rows fade. Required inputs must be filled before tick. Handoff wording specifies weight/reps for weight, weight × time and distance exercises, reps otherwise; map exact fields per exercise type with owner if this wording conflicts with duration/distance UI. Do not silently guess away the ambiguity.
- Editing set 1 autofills later sets only if empty or unchanged. Fields select all on tap.
- Previous values: last same-routine session, then routine defaults, then any workout. Tap shows Previous and Max.
- Set kinds warmup/drop/failure; RPE 6–10; Duplicate (not copy paste), Delete.
- PR if beating best weight, Epley estimated 1RM or best single-set volume. First-ever, warmup and estimated sets never count. Only weight × reps and weighted-bodyweight count for volume/records. Recompute at finish; preserve running-best behaviour from engine specification.

## Finish, history and cards

- Duration required; block saving until set in plain card below date/time.
- Clamp future workout dates to now.
- Optional photo; Update routine values defaults on, updates only weights/reps of existing routine sets. Accent WhatsApp Share with friends row.
- Warn “Not all sets are completed” for unticked sets. Exercise Continue similarly warns; reads Done when all ticked.
- Post-workout stacked swipe cards with share-image per card using share sheet/PNG fallback: streak only on first workout of week; summary with kcal/volume/duration/sets/title/muscles; “that's like lifting a horse”; records with accent medal and weight × reps.
- One-time donation popup after fourth workout.

## Forgotten-set reconstruction

- Set 1…n and All sets chips; logged sets disabled.
- Optional remembered weight, effort/RPE, rest, energy, sleep, soreness and stress.
- Ranked guesses, best highlighted; select and Use this estimate.
- Badge estimated sets; exclude from PR and future estimates. Keep estimate log for accuracy checks.

Exact estimator constants:

1. Last four exercise sessions; same routine first; recency weights 0.5 / 0.3 / 0.2 / 0.1. Per-position strength is weighted mean of weight × (1 + reps/30). Predicted reps at W: 30 × (strength/W − 1).
2. Today's completed sets scale strength by their ratio to baseline to power 0.7.
3. Nudges: energy [0.97, 1, 1.02], sleep [0.985, 1, 1.01], soreness [1.005, 1, 0.97], stress [1, 1, 0.985], rest [0.97, 1, 1.01]. Halve nudge when sets logged today.
4. Earlier same-muscle sets multiply by 1 − 0.01 × min(n, 6). Last-two-session trend factor 1 + 0.3 × clamp(trend − 1, −0.1, 0.1). RPE adds 0.6 × (rpe − 8) reps.
5. Candidate weights: remembered weight alone, otherwise last weight ± smallest plate step. Priors 0.6 / 0.25 / 0.15 without today's sets, 0.72 / 0.14 / 0.14 with; energy shifts 0.05. Verify candidate ordering against prototype rather than assuming which offset gets each prior.
6. Sigma 1.6; 2.4 with fewer than two sessions; ×0.85 with today's sets; ×0.85 with RPE; ×0.9 with known weight. Score log(prior) − (reps − mean)^2/(2 sigma^2), softmax, top four.
7. Abstain without weighted history. Preserve these numbers; test exact behaviour against source fixtures.

## Programs, library and routine editing

- At least two templates per day count, 1–7. Matching profile days first, labelled Recommended for you without border; other templates dimmed.
- Weekday patterns: 1 Mon; 2 Mon/Thu; 3 Mon/Wed/Fri; 4 Mon/Tue/Thu/Fri; 5 Mon/Tue/Thu/Fri/Sat; 6 Mon–Sat; 7 every day.
- Bundle 420 exercises; permanent serials 1–420. `1.webp` is Barbell Bench Press. Keep stable slug IDs despite future name edits; custom records permanent unique IDs.
- Custom exercises/user images saved; production library editor read-only for bundled records unless user approves a separate override model.
- New requested behaviour: routine selection saves immediately, exercises shown with sets, add/remove without losing changes on Back. Inline controls/Undo/top-bar extent await answers in DECISIONS.
- Search/filters/favourites/equipment and existing prototype interactions retained through inventory.

Types: weight × reps (`kr`), bodyweight reps (`br`), seconds (`du`), minutes (`mn`), distance + time (`di`), weighted bodyweight (`wb`), weight × time (`wt`), assisted (`as`). Storage units kg/km/cm; display converts to lb/in and appropriate distance units.

Equipment (15): Barbell, Dumbbell, Bodyweight, Kettlebell, EZ bar, Trap bar, Cable, Machine, Smith machine, Weighted, Resistance band, Suspension, Cardio machine, Outdoors, Other.

Muscles for stats (11): Chest, Back, Shoulders, Biceps, Triceps, Forearms, Abs, Quads, Hamstrings, Glutes, Calves. Library also Neck and Cardio.

## Home, stats and measurements

- Greeting on two lines: time greeting, then name.
- Home/Stats configurable block grids; plus tile opens edit. Hold ~380 ms to drag; minus removes; Not added list restores; Done top right.
- Week streak, month calendar, front/back muscle figure with tap name/recovery, radar, recovery, records, calories and formula page.
- Strength MET by difficulty [3.5, 5, 6, 6.5], default moderate. Cardio MET: run 9.8, walk 3.8, bike 7.5, row 7, swim 6, elliptical 5, jump rope 11, fallback 6. Calories = MET × body weight kg × hours; fallback body weight 70 kg.
- Recovery = hours since last trained / (24 + 4 × min(sets, 12)). Confirm presentation clamp from source, without altering formula.
- Calories eaten: Connect Healthify placeholder only, planned after Dropbox. Real integration not currently scoped.
- Measures with line charts: body weight, body fat, lengths and custom. Progress photos.

## Settings, onboarding and platform

- Metric/imperial, first weekday, Android-only haptics, sound. No pinch zoom per handoff; assess accessibility consequences with owner during polish.
- Swipe tabs and sheet-down close. Android Back: close sheets, then Home, then exit on second press.
- Welcome, ten choose-then-Continue onboarding slides, never auto advance; No account found; Save locally warning; first-logger walkthrough.
- Dropbox connect opens directly and redirects back; connected screen then Let's go. No pasted code.
- Delete account/profile flow: eight reasons; conditional fields; Other text required; Dropbox video for sync reason; type delete confirmation. Actual action is local deletion per existing demo wording; cloud deletion is separate and must not be silently added.
- Logout erases local data only after explicit warning. Pending changes need truthful treatment; connection alone isn't proof data reached Dropbox.
- Google Forms for delete feedback/issue reports; no Replift backend. Unprovided URLs remain placeholders with clear behaviour.

## Design tokens

Dark only. bg #121010; text #F7F5E4; accent #C4BCA8; green #62d391; red #ef5b4d; surfaces #1a1817 / #252221 / #2f2b2a. Rethink Sans 500/700/800; heading extra-bold tracking −1%, app text −2%. Cards radius 28 px. Motion cubic-bezier(.22,1,.36,1). Entrance animations once on mount, not every update. Clean Apple/Lyfta-inspired visual style; generic reference document doesn't change product or palette.

Exercise illustration style: charcoal #181818 background, bold black ink outline, smooth grayscale shading, red target muscles, no text/labels, square. First bench-press image is style reference. Historical conversion script `convert-to-webp.py` was described but isn't present in current supplied files; recreate when needed and authorized. Output `public/exercises/<serial>.webp`.

CSV columns: serial, image_file, exercise, muscle_group_in_app, target_muscle_red_highlight, secondary_synergist_muscles, equipment, equipment_mechanics, logging_type, movement_pattern, compound_or_isolation, unilateral_or_bilateral, difficulty, biomechanics_and_body_position, optimal_perspective, pose_to_illustrate, grip_and_stance, design_consistency, image_prompt, negative_prompt.

## Legacy data and reconstruction source

localStorage key `replift.v1`:

- `ex`: exercises {id,n,m,s,e,t,img}.
- `prog`: {id,n,routines:[{id,n,day,ex,vals}]}.
- `wk`: {id,t,r,title,dur,notes,diff,items:[{ex,sets:[{kg,reps,k,rpe,pr,est,done}]}]}.
- `draft`, `pin` notes, `fav`, `have` equipment.
- `st`: settings including pr,warm,vib,sets,snd,push,upd,fd,u,wad,ds,dq,l2,l3,v4 plus Demo B sync fields. Keep credentials local and out of exports/cloud.
- `lay` layouts; `ms` measures; `cm` custom measures; `ph` {id,t,img}.
- `pf` profile {fn,ln,g,goals,exp,days,used}; `ob` {done,i,m,acct}; `wt` walkthrough; `bk` last backup; `pl` estimate log.
- Set kinds w/d/f. Validate actual source shapes before writing migrations; retain unknown recoverable fields rather than discarding them silently.

Unavailable Zip 2 architecture: domain types/units/validation/sets/time/calories/muscles/templates/reconstruct/summary; data library/schema/migrate/storage/persistence; state lookup/reducers/store with debounced persistence. Prior claimed tests covered previous values, record running best, autofill, finish, routine updates, fourth-workout prompt, bad backups, and damaged data retained under a corrupt key. These are future test requirements, not recovered tests.

## Public build configuration

Historical intended names: VITE_APP_ENV, VITE_DROPBOX_APP_KEY, VITE_FORM_DELETE_URL, VITE_FORM_ISSUE_URL, VITE_LINK_WHATSAPP, VITE_LINK_X, VITE_LINK_INSTAGRAM, VITE_LINK_STRAVA, VITE_LINK_EMAIL, VITE_LINK_DONATE, VITE_LINK_DROPBOX_VIDEO, VITE_REPO. All frontend variables are public. Store OAuth tokens/signing keys outside these and outside the repo. Confirm exact naming in foundation env example.
