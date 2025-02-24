
import Link from 'next/link';
import React from 'react'

export default async function Page() {
  const posts = ["post1", "post2", "post3"];
  return (
    <ul>
      {posts && posts.map((index,post) => (
        <Link href={`/blog/${post}`} key={index}>
          {post}
        </Link>
      ))}
    </ul>
  );
}