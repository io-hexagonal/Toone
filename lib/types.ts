export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
  bio: string;
}

export interface Comment {
  authorId: string;
  date: string;
  content: string;
}

export interface Post {
  id: number;
  slug: string;
  date: string;
  authorId: string;
  tags: string[];
  category: string;
  title: string;
  description: string;
  content: string;
  featuredProject?: string;
  comments: Comment[];
}
