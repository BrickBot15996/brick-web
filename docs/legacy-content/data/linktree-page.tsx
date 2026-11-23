"use client";

import { IconCard, LinkCard } from "brickbot-ui";
import Image from "next/image";
import Link from "next/link";
import {
  CiFacebook,
  CiGlobe,
  CiInstagram,
  CiLinkedin,
  CiMail,
} from "react-icons/ci";
import { PiTiktokLogoLight, PiYoutubeLogoLight } from "react-icons/pi";
import { VscGithubAlt } from "react-icons/vsc";
import { motion } from "framer-motion";
import { CDN_LINK } from "./constants";

export default function Home() {
  const date = new Date();

  return (
    <div className="flex min-h-screen items-start justify-center bg-(--bg-dark) relative select-none overflow-hidden">
      <div
        className="absolute top-[min(calc(20rem-18vw),0rem)] bg-linear-to-b from-[#1c1c1c] to-(--bg-dark) to-50% h-auto w-full aspect-[1.2/1] max-w-[min(100vw,120rem)] overflow"
        style={{
          WebkitMaskImage: `url(${CDN_LINK}/branding/new-logo.svg)`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          maskImage: `url(${CDN_LINK}/branding/new-logo.svg)`,
          maskRepeat: "no-repeat",
          maskPosition: "top center",
          maskSize: "contain",
        }}
      />
      <div className="flex flex-col items-center justify-center gap-[2rem] mt-[clamp(2.5rem,2rem+5vw,6rem)] h-full max-w-(--content-width) z-[100]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full h-full flex flex-col gap-[1rem] items-center"
        >
          <div className="relative w-full h-[clamp(5.5rem,_5.5rem+5vw,_9rem)] overflow-hidden">
            <div
              role="img"
              aria-label="BrickBot Logo"
              className="w-full h-full bg-[#ffff00]"
              style={{
                maskImage: `url("${CDN_LINK}/branding/new-logo.svg")`,
                WebkitMaskImage: `url("${CDN_LINK}/branding/new-logo.svg")`,
                maskMode: "alpha",
                WebkitMaskComposite: "source-over",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }}
            />
          </div>

          <div className="relative w-full h-[clamp(3rem,_3rem+3vw,_4.5rem)] mt-[var(--related-gap)] translate-y-[-0.75rem] overflow-hidden">
            <div
              role="img"
              aria-label="BrickBot"
              className="w-full h-full bg-[#ffff00]"
              style={{
                maskImage: `url("${CDN_LINK}/branding/wordmark.svg")`,
                WebkitMaskImage: `url("${CDN_LINK}/branding/wordmark.svg")`,
                maskMode: "alpha",
                WebkitMaskComposite: "source-over",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }}
            />
          </div>
          <h1 className="text-md text-[#f8f8f8] font-semi-condensed mt-[var(--related-gap)]">
            FTC Team 15996
          </h1>
        </motion.div>
        <SocialIcons />
        <Links />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute left-auto right-auto bottom-[2rem] text-[#9B9B9B] text-xs"
        >
          BrickBot © {date.getFullYear()}
        </motion.div>
      </div>
    </div>
  );
}

function SocialIcons() {
  return (
    <div className="grid grid-rows-2 w-full gap-[2rem]">
      <motion.div
        initial={{ opacity: 0, translateY: 60 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          visualDuration: 0.4,
          ease: "easeOut",
          type: "spring",
          bounce: 0.35,
        }}
        className="flex flex-row justify-between items-center w-full"
      >
        <Link
          href="https://brickbot.ro/en"
          target="_blank"
          aria-label="Team Website"
        >
          <IconCard>
            <CiGlobe className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="https://www.instagram.com/brickbotcnu/"
          target="_blank"
          aria-label="Team Instagram"
        >
          <IconCard>
            <CiInstagram className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="https://www.facebook.com/brickbotcnu/"
          target="_blank"
          aria-label="Team Facebook"
        >
          <IconCard>
            <CiFacebook className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="https://www.tiktok.com/@brickbotcnu"
          target="_blank"
          aria-label="Team TikTok"
        >
          <IconCard>
            <PiTiktokLogoLight className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, translateY: 60 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          visualDuration: 0.4,
          ease: "easeOut",
          type: "spring",
          bounce: 0.35,
          delay: 0.1,
        }}
        className="flex flex-row justify-between items-center w-full"
      >
        <Link
          href="https://www.linkedin.com/company/brickbot/"
          target="_blank"
          aria-label="Team LinkedIn"
        >
          <IconCard>
            <CiLinkedin className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="mailto:contact@brickbot.ro"
          target="_blank"
          aria-label="Team Email"
        >
          <IconCard>
            <CiMail className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="https://www.youtube.com/channel/UCRpA5UNXSZDl2GmPt_E91ew"
          target="_blank"
          aria-label="Team YouTube"
        >
          <IconCard>
            <PiYoutubeLogoLight className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
        <Link
          href="https://github.com/BrickBot15996"
          target="_blank"
          aria-label="Team GitHub"
        >
          <IconCard>
            <VscGithubAlt className="h-[2rem] w-[2rem] fill-(--text)" />
          </IconCard>
        </Link>
      </motion.div>
    </div>
  );
}

function Links() {
  const linkList = [
    {
      title: "Join our global mentorship program, BrickBot Academy!",
      displayLink: "brickbot.ro/academy",
      highlighted: true,
      link: "https://brickbot.ro/academy",
    },
    {
      title: "Support BrickBot through a secure online donation!",
      displayLink: "brickbot.ro/donate",
      highlighted: false,
      link: "https://brickbot.ro/donate",
    },
    {
      title: "Redirect 3.5% of your income tax to help BrickBot!",
      displayLink: "brickbot.ro/formular230",
      highlighted: false,
      link: "https://brickbot.ro/formular230",
      icon: (
        <div className="h-(--icon-size) w-(--icon-size)">
          <div
            className="w-full h-full bg-(--text)"
            style={{
              WebkitMaskImage: `url(${CDN_LINK}/icons/230.svg)`,
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              WebkitMaskSize: "contain",
              maskImage: `url(${CDN_LINK}/icons/230.svg)`,
              maskRepeat: "no-repeat",
              maskPosition: "center",
              maskSize: "contain",
            }}
          />
        </div>
      ),
    },
  ];

  const date = new Date();

  return (
    <div className="flex flex-col gap-[2rem] mb-[5.5rem]">
      {linkList.map((link, index) => {
        if (
          ((date.getDate() > 24 && date.getMonth() === 4) ||
            date.getMonth() >= 5) &&
          link.displayLink == "brickbot.ro/formular230"
        ) {
          return null;
        }

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, translateY: 60 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              visualDuration: 0.4,
              ease: "easeOut",
              type: "spring",
              bounce: 0.35,
              delay: index * 0.1 + 0.2,
            }}
          >
            <Link
              href={link.link}
              target="_blank"
              aria-label={link.title}
              key={link.link}
            >
              <LinkCard
                title={link.title}
                displayLink={link.displayLink}
                highlighted={link.highlighted}
                icon={link.icon}
              />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
