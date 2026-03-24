import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-500">
      <section className="bg-white/60 border border-white rounded-[48px] p-10 md:p-14 shadow-sm backdrop-blur-sm mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-[#1a0e1b] mb-4 tracking-tight">
          About RecipeHub
        </h1>
        <p className="text-zinc-600 text-lg leading-relaxed font-medium">
          RecipeHub is a modern cooking community where home cooks, creators, and professional chefs
          share their best recipes through engaging, story-driven videos. Every recipe is designed to
          feel like a guided session in your own kitchen — simple to follow, inspiring to watch, and
          easy to revisit whenever you want to cook again.
        </p>
      </section>

      <section className="bg-white/50 border border-white rounded-[40px] p-8 md:p-10 shadow-sm mb-8">
        <h2 className="text-2xl font-black text-[#1a0e1b] mb-3">Our Mission</h2>
        <p className="text-zinc-600 leading-relaxed font-medium">
          The mission of RecipeHub is to make great cooking feel approachable for everyone. We bring
          together everyday cooks and culinary professionals in a single place so that you can
          discover new dishes, learn trusted techniques, and build your own library of favorite
          recipes — all in a welcoming, supportive environment.
        </p>
      </section>

      <section className="bg-white/50 border border-white rounded-[40px] p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl font-black text-[#1a0e1b] mb-3">Share & Discover Recipes</h2>
        <p className="text-zinc-600 leading-relaxed font-medium mb-4">
          As a creator, you can upload your own recipe videos, add step-by-step instructions, and
          share tips that make each dish uniquely yours. As a viewer, you can follow your favorite
          cooks, save recipes to try later, and return to in-progress videos from your profile or
          home feed.
        </p>
        <p className="text-zinc-600 leading-relaxed font-medium">
          RecipeHub is built for people who love food and want a calm, focused space to cook, learn,
          and grow together.
        </p>
      </section>
    </div>
  );
};

