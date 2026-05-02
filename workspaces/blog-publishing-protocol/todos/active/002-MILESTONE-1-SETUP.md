# Milestone 1: Setup & Enablement (Weeks 1-2)

**Goal**: Configure infrastructure, enable team, establish publishing baseline

**Duration**: 2 weeks

**Todos**: 6 total

---

## Todo 1.1: Set Up Google Search Console Monitoring

**Status**: Pending

**Description**: Configure Google Search Console for the blog domain to track impressions, clicks, rankings, and CTR.

**What This Includes**:
- Verify site ownership in GSC (if not already done)
- Submit XML sitemap to GSC
- Create custom dashboard for blog keyword tracking
- Set up email alerts for ranking changes
- Document GSC login credentials for team

**Why This Matters**: GSC is the single source of truth for organic search performance. Weekly GSC checks enable rapid iteration on underperforming titles/metas.

**Success Criteria**:
- [ ] Site verified in GSC
- [ ] Sitemap submitted and crawled
- [ ] Dashboard created with 50-100 target keywords
- [ ] Team trained on how to read GSC metrics
- [ ] Email alerts configured

**Implements**: `specs/technical-seo-standards.md` § Sitemap and robots.txt standards

**Effort**: Low (2-3 hours, one-time setup)

**Owner**: SEO Specialist

**Timeline**: Week 1, Days 1-2

---

## Todo 1.2: Set Up Google Analytics 4 Blog Tracking

**Status**: Pending

**Description**: Configure GA4 to track blog traffic, user behavior, and conversion data.

**What This Includes**:
- Verify GA4 property is configured for blog subdomain (or site)
- Create custom events for article engagement (scroll depth, time on page, internal link clicks)
- Set up blog-specific dashboard (traffic source, article performance, behavior flow)
- Configure goal/conversion tracking (contact form, product page clicks, CTA clicks)
- Document GA4 report access for team

**Why This Matters**: GA4 complements GSC (search visibility) with user behavior data (engagement, conversions).

**Success Criteria**:
- [ ] GA4 property tracking blog traffic
- [ ] Custom events firing (page scroll, link clicks, time on page)
- [ ] Dashboard created with key metrics (organic traffic, bounce rate, avg session duration, conversions)
- [ ] Team trained on GA4 report interpretation

**Implements**: `specs/growth-roadmap-90days.md` § Traffic Metrics to Monitor

**Effort**: Low (2-3 hours)

**Owner**: Analytics Specialist / Web Lead

**Timeline**: Week 1, Days 1-2

---

## Todo 1.3: Create Publishing Workflow Checklist Spreadsheet

**Status**: Pending

**Description**: Build a Google Sheets template for managing the publishing workflow for 56 articles.

**What This Includes**:
- Column headers: Article #, Title, Target Keyword, Pillar, Type, Status (Research/Write/Optimize/Publish/Promote), Owner, Research Date, Publish Date, GSC Impressions (Week 1/2/3), Ranking Position, Traffic
- Pre-populate with 56 article titles from `specs/growth-roadmap-90days.md`
- Color coding for status tracking (red=pending, yellow=in progress, green=published)
- Formulas to track publishing cadence (articles per week)
- Share settings for team (view/edit permissions)

**Why This Matters**: Spreadsheet is the single source of truth for publishing status and helps team stay coordinated.

**Success Criteria**:
- [ ] All 56 articles listed with titles, keywords, pillar assignments
- [ ] Status columns for each phase (research → publish)
- [ ] Automated tracking of articles per week published
- [ ] Team members have edit access
- [ ] First 3 articles (pillars) populated with Week 1 start dates

**Implements**: `specs/blog-publishing-workflow.md` § Phase Workflow Timeline

**Effort**: Medium (4-5 hours; includes onboarding team to template)

**Owner**: Project Manager / Editorial Lead

**Timeline**: Week 1, Days 2-4

---

## Todo 1.4: Establish Editorial Calendar (90-Day Schedule)

**Status**: Pending

**Description**: Finalize publishing dates for all 56 articles across 90 days.

**What This Includes**:
- Follow `specs/growth-roadmap-90days.md` publishing schedule (1 article every 2-3 days for phase 1, 2/week for phases 2-3)
- Assign articles to writers (if multiple writers)
- Block calendar dates in team calendar (Google Calendar, Asana, Monday, etc.)
- Create deadline reminders (article draft due 10 days before publish; QA due 3 days before; publish date 1 day before)
- Document any scheduling constraints (vacation, product launches, holidays)

**Why This Matters**: Public calendar commitment increases follow-through. Deadline reminders prevent last-minute cramming.

**Success Criteria**:
- [ ] All 56 articles have assigned publish dates (days 1-90)
- [ ] Articles assigned to writers (balanced workload)
- [ ] Calendar synchronized with team tools (Google Calendar, project management software)
- [ ] Deadline reminders set (draft, QA, publish for each article)
- [ ] Phase targets confirmed: Day 30 (16 articles), Day 60 (40 articles), Day 90 (56 articles)

**Implements**: `specs/growth-roadmap-90days.md` § 90-Day Content Calendar Template

**Effort**: Low (3-4 hours)

**Owner**: Project Manager / Editorial Lead

**Timeline**: Week 1, Days 3-5

---

## Todo 1.5: Team Training on Blog Publishing Protocol

**Status**: Pending

**Description**: Onboard writers, editors, and SEO specialists on the complete publishing workflow.

**What This Includes**:
- **For writers**: Review `article-template.md`, example articles, 5-phase workflow
- **For editors/QA**: Review `seo-optimization-checklist.md` (47 points), link validation process
- **For SEO specialists**: Review keyword research protocol, competitor analysis, internal linking strategy
- **For all**: Live walkthrough of one complete 13-day article workflow (from research to promote)
- Recording of training session for asynchronous viewing
- Q&A session to clarify doubts

**Why This Matters**: Team alignment on process ensures consistent quality and reduces rework.

**Success Criteria**:
- [ ] All writers, editors, SEO specialists attended training (or watched recording)
- [ ] Team understands 5-phase workflow
- [ ] Team can identify what phase an article is in and next steps
- [ ] Team knows how to use article template and checklist
- [ ] At least 1 practice article walked through by team

**Implements**: `specs/blog-publishing-workflow.md` (entire workflow document)

**Effort**: Medium (6-8 hours including preparation, training, Q&A)

**Owner**: Content Lead / Editor

**Timeline**: Week 1, Days 4-7

---

## Todo 1.6: Finalize Keyword List (All 50+ Keywords Validated)

**Status**: Pending

**Description**: Complete 4-phase keyword research for all 36 cluster articles + confirm 3 pillar keywords.

**What This Includes**:
- **Phase 1 (Seed)**: Generate 50-100 seed keywords from domain topics; note rough search volumes
- **Phase 2 (Intent)**: Assign intent type (informational/transactional/commercial/long-tail) and priority (P0/P1/P2) to each keyword
- **Phase 3 (Competition)**: For all P0/P1 keywords, analyze top-3 ranking pages (word count, DA, backlinks); determine if beatable
- **Phase 4 (Long-tail)**: Mine Google People Also Ask, Reddit/Quora for question-based keywords and long-tail variants
- **Output**: Spreadsheet with 50-100 validated keywords, mapped to pillar assignments, article titles, and priority

**Why This Matters**: Every article should be built around a validated keyword. Guessing keywords wastes writing effort.

**Success Criteria**:
- [ ] All 36 cluster keywords validated (search volume + competition checked)
- [ ] All 3 pillar keywords confirmed (high volume, competitive but achievable)
- [ ] Keyword difficulty assessed (DA of top-3 results noted)
- [ ] Keywords mapped to article titles and pillar assignments
- [ ] Spreadsheet shared with team and SEO lead
- [ ] 10-15 question-based long-tail keywords identified for Phase 3 articles

**Implements**: `specs/keyword-research-protocol.md` § 4-Phase Keyword Research Workflow

**Effort**: High (12-16 hours; intensive research, competitor analysis, validation)

**Owner**: SEO Specialist

**Timeline**: Week 1-2, parallel with other setup tasks (Days 1-14)

---

## Milestone 1 Success Criteria

- [ ] Todo 1.1: GSC configured; keywords tracked
- [ ] Todo 1.2: GA4 configured; dashboard live
- [ ] Todo 1.3: Publishing checklist spreadsheet created and team trained
- [ ] Todo 1.4: 90-day editorial calendar finalized
- [ ] Todo 1.5: Entire team trained on protocol
- [ ] Todo 1.6: All 50+ keywords validated and mapped

**Team is ready to start Article #1 (Pillar 1) on Day 3 of Week 2.**

---

## Timeline

**Week 1**:
- Mon-Tue (Days 1-2): Todo 1.1 + 1.2 (GSC + GA4 setup)
- Wed-Thu (Days 3-4): Todo 1.3 + 1.4 (Spreadsheet + calendar)
- Fri (Day 5): Todo 1.5 (Team training)

**Week 2**:
- Mon-Fri (Days 8-12): Todo 1.6 (Keyword research) + start Milestone 2 (Pillar pages)

