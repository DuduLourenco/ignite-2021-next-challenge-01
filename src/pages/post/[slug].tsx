import { GetStaticPaths, GetStaticProps } from 'next';

import { ReactElement } from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import * as PrismicH from '@prismicio/helpers';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

type PostContent = {
  heading: string;
  body: {
    text: string;
  }[];
};

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: PostContent[];
  };
}

interface PostProps {
  post: Post;
}

const getReadTime = (content: PostContent[]): number => {
  const readTime = content
    .map(c => {
      const headingWords = c.heading?.split(' ').length || 0;
      const bodyWords = c.body
        ? PrismicH.asText(c.body as unknown as any).split(' ').length
        : 0;

      return headingWords + bodyWords;
    })
    .reduce((previousValue, currentValue) => previousValue + currentValue);

  return Math.ceil((readTime || 0) / 200);
};

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  const pageTitle = `${post.data.title} | Space Traveling`;

  if (router.isFallback) {
    return (
      <main className={styles.container}>
        <div className={commonStyles.fallback}>Carregando...</div>
      </main>
    );
  }

  const PostContent = (): ReactElement => {
    const contents = post.data.content.map(content => {
      return (
        <>
          {content.heading && <h2>{content.heading}</h2>}
          <div
            dangerouslySetInnerHTML={{
              __html: PrismicH.asHTML(content.body as unknown as any),
            }}
          />
        </>
      );
    });

    return <div className={styles.content}> {contents} </div>;
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <img
        className={styles.banner}
        src={post.data.banner.url}
        alt={post.data.banner.alt}
      />

      <main className={styles.container}>
        <article>
          <header>
            <h1>{post.data.title}</h1>

            <div className={styles.additionalInfos}>
              <span>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </span>

              <span>
                <FiUser />
                {post.data.author}
              </span>

              <span>
                <FiClock /> {getReadTime(post.data.content)} min
              </span>
            </div>
          </header>

          <PostContent />
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  return {
    paths: [
      {
        params: { slug: String(posts.results[0].uid) },
      },
      {
        params: { slug: String(posts.results[1].uid) },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug));

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
