import { BookOpen, Music, Users, type LucideIcon } from "lucide-react";

export type Role = "student" | "teacher" | "parent";

export const ROLES: Role[] = ["student", "teacher", "parent"];

export function isRole(value: string | undefined): value is Role {
  return ROLES.includes(value as Role);
}

interface Copy {
  heading: string;
  subheading: string;
}

export interface RoleConfig {
  title: string;
  tagline: string;
  icon: LucideIcon;
  signup: Copy;
  login: Copy;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  student: {
    title: "Student",
    tagline: "Learn, play, and level up",
    icon: Music,
    signup: {
      heading: "Ready for your adventure?",
      subheading: "Tell us a little about your music journey."
    },
    login: {
      heading: "Welcome back!",
      subheading: "Log in to keep your quest going."
    }
  },
  teacher: {
    title: "Teacher",
    tagline: "Guide your classroom",
    icon: BookOpen,
    signup: {
      heading: "Create your teacher account",
      subheading: "Set up your classroom in just a minute."
    },
    login: {
      heading: "Welcome back",
      subheading: "Log in to check on your classroom."
    }
  },
  parent: {
    title: "Parent",
    tagline: "Follow their progress",
    icon: Users,
    signup: {
      heading: "Follow your child's progress",
      subheading: "Connect to their learning account securely."
    },
    login: {
      heading: "Welcome back",
      subheading: "Log in to see how your child is doing."
    }
  }
};
