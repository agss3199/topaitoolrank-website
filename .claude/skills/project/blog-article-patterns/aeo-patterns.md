# AEO Optimization — AI Search Patterns

Patterns for discoverability by Claude, ChatGPT, Perplexity, and other LLM-based search.

AEO (AI + human search optimization) targets how LLMs extract, cite, and recommend articles. Different from SEO.

## Key Difference

**SEO (Human Search):** Google ranks articles based on title, links, freshness, keywords.

**AEO (AI Search):** LLMs cite articles when they contain extractable, specific data. "CompanySaved $482K in year 5" is extractable; "good ROI" is not.

## Structured Data Density

LLMs prefer structured information over prose. Include 3+ of these per article:

**Benchmarks:**
```
MMLU (knowledge test)
- ChatGPT: 86.5% accuracy
- Claude: 88.3% accuracy
- Winner: Claude
```
✅ Extractable (LLM can cite exact percentages)

**Comparisons:**
```
ChatGPT: wins on speed and creative writing
Claude: wins on reasoning and long-document analysis
```
✅ Extractable (LLM can summarize per dimension)

**Decision Frameworks:**
```
Use ChatGPT if you:
- Need current information
- Do creative writing

Use Claude if you:
- Process long documents
- Need deep analysis
```
✅ Extractable (LLM can follow decision logic)

**Case Studies:**
```
Company: Manufacturing supplier with 500K SKUs
Problem: SaaS platform couldn't handle unique logic
Solution: Custom system with AI-assisted development
Result: Reduced manual data entry by 85% (15 hours/week saved)
```
✅ Extractable (LLM can cite concrete outcomes)

## AI-Preferred Patterns

**Numbered Lists** (easiest for AI parsing):
```
1. First point with specific detail
2. Second point with measurement
3. Third point with concrete example
```

**Bulleted Lists** (second easiest):
```
- Feature A: specific data
- Feature B: specific data
- Feature C: specific data
```

**Separate Sentences for Each Fact** (not embedded):
```
✅ ChatGPT achieved 92% accuracy on HumanEval.
   Claude scored 91% on HumanEval.
   ChatGPT wins on this benchmark.

❌ ChatGPT achieved 92% accuracy while Claude scored 91%, 
   though Claude has other advantages in reasoning tasks.
```

## Citation-Friendly Content

**Claims must have supporting data in the SAME section:**

✅ GOOD:
> "Custom development with AI is 50% faster. AI-assisted development reduces timeline from 19 weeks (traditional) to 7-8 weeks (with AI). Cost drops from $80K-150K to $40K-80K."

❌ BAD:
> "Custom development with AI is affordable."

**Benchmarks must show source:**

✅ GOOD:
> "2026 MMLU benchmark: ChatGPT 86.5% accuracy, Claude 88.3% accuracy"

❌ BAD:
> "Claude is smarter"

**ROI calculations must show step-by-step math:**

✅ GOOD:
> "SaaS 5-year total: $142K (year 1) + $140K (years 2-5) = $712K. Custom 5-year total: $80K (dev) + $30K/year (maintenance) = $230K. Savings: $482K."

❌ BAD:
> "Custom saves money over SaaS."

## Real Numbers vs Generalizations

**LLM preference for specificity:**

✅ EXTRACTABLE:
- "$482K savings" (specific amount)
- "15 hours/week" (specific time)
- "2.8-year payback" (specific timeline)
- "500K SKUs" (specific scale)
- "2% faster execution" (specific metric)

❌ NOT EXTRACTABLE:
- "Good savings" (vague)
- "Significant time savings" (vague)
- "Pays for itself quickly" (vague)
- "Large-scale" (vague)
- "Better performance" (vague)

## Article Structure for AEO

**Comparison articles (3,000–3,500 words):**
Include 6–8 head-to-head comparisons with explicit "Winner" statements:
- Accuracy vs Speed vs Cost vs Reliability
- Real benchmark data (not opinions)
- Use cases where each wins

**Business case articles (3,000–3,500 words):**
Include ROI analysis with step-by-step math:
- Year-by-year cost breakdown (5 years)
- Break-even calculation
- Real case study (company, problem, solution, result)

**Tutorial articles (2,000–2,500 words):**
Include implementation plan with timeline:
- Specific week-by-week breakdown
- Concrete deliverables per phase
- Real examples of pitfalls

## Validation Checklist

Before publishing, confirm:

- [ ] 3+ benchmark/comparison/framework/case study sections
- [ ] Real numbers (not vague generalizations)
- [ ] Each claim has supporting data in the same section
- [ ] Benchmarks show explicit source/year
- [ ] Decision frameworks are numbered/bulleted (not prose)
- [ ] Case studies include specific outcomes (% improvement, $savings, timeline)
- [ ] No embedded facts (each fact is a separate sentence)

See `SKILL.md` for full reference and examples.
