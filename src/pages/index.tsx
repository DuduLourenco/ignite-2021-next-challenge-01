import { GetStaticProps } from 'next';
import Head from 'next/head';

import { ReactElement, useState } from 'react';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [pagination, setPagination] = useState(postsPagination);

  const loadingMorePosts = (): void => {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        setPagination(state => ({
          ...state,
          results: [...state.results, ...data.results],
          next_page: data.next_page,
        }));
      });
  };

  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {pagination.results.map(post => (
            <Link key={post.uid} href={`post/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <span>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>

                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {pagination.next_page && (
          <button
            type="button"
            onClick={loadingMorePosts}
            className={styles.loadingMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1 });

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
