/**
 * FAQSchema -- FAQPage JSON-LD structured data + visible FAQ section
 *
 * Renders a <script type="application/ld+json"> tag with Schema.org
 * FAQPage markup for search engine rich results, plus a visible
 * FAQ section for users.
 */

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQSchemaProps {
  questions: FAQItem[];
  title?: string;
}

export default function FAQSchema({ questions, title = "Frequently Asked Questions" }: FAQSchemaProps) {
  if (!questions || questions.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section
        style={{
          maxWidth: '800px',
          margin: '2rem auto',
          padding: '0 1rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: '#e2e8f0',
          }}
        >
          {title}
        </h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {questions.map((item, index) => (
            <details
              key={index}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                }}
              >
                {item.q}
              </summary>
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.95rem',
                  color: '#94a3b8',
                  lineHeight: 1.7,
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
