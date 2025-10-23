import Link from "next/link";
import { styled, keyframes, Box } from "../stitches.config";
import { useCart } from "../lib/cart";
import {
  HomeIcon,
  ArchiveIcon,
  GearIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import * as Switch from "@radix-ui/react-switch";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

const scaleUp = keyframes({
  "0%": { transform: "scale(1)", background: "$crimson10" },
  "50%": { transform: "scale(1.5)" },
  "100%": { transform: "scale(1)" },
});

const Wrapper = styled("div", {
  paddingLeft: "$4",
  marginLeft: "-$4",
  paddingRight: "$4",
  marginRight: "-$4",
  borderBottom: "1px solid $mauve4",
  borderTop: "1px solid $mauve4",
});

const MenuBarBox = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  direction: "ltr",
  alignItems: "center",
  boxShadow:
    "0px 10px 20px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.04), 0px 0px 1px rgba(0, 0, 0, 0.04)",
  background: "$mauve1",

  "&>svg": {
    cursor: "pointer",
    color: "$mauve11",
  },
});

const CartSizeIcon = styled("div", {
  position: "absolute",
  bottom: "-4px",
  right: "-8px",
  background: "$crimson1",
  border: "1px solid $mauve5",
  width: "16px",
  height: "16px",
  fontSize: "10px",
  borderRadius: "9999px",
  display: "grid",
  placeContent: "center",

  variants: {
    animate: {
      true: {
        animation: `${scaleUp} 200ms`,
      },
      false: {},
    },
  },

  defaultVariants: {
    animate: false,
  },
});

const Item = styled("div", {
  flex: 1,
  display: "grid",
  placeContent: "center",
  padding: "$4",
  cursor: "pointer",
  width: 20, // fixed width
  height: 20,

  "&:hover": {
    background: "$mauve3",
  },

  "&:focus, &:active": {
    boxShadow: "0px 0px 2px 0px $mauve10",
  },
});

const StyledContent = styled(Popover.Content, {
  borderRadius: 1,
  padding: "20px",
  fontSize: 14,
  backgroundColor: "$mauve1",
  border: "1px solid $mauve4",
  color: "black",
  direction: "ltr",
});

const StyledTrigger = styled(Popover.Trigger, {
  all: "unset",
});

const StyledSwitch = styled(Switch.Root, {
  all: "unset",
  width: 42,
  height: 25,
  backgroundColor: "$crimson8",
  borderRadius: "9999px",
  position: "relative",
  WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
  "&:focus": { boxShadow: `0 0 0 2px $crimson9` },
  '&[data-state="checked"]': { backgroundColor: "$crimson9" },
});

const StyledThumb = styled(Switch.Thumb, {
  display: "grid",
  placeContent: "center",
  width: 21,
  height: 21,
  backgroundColor: "$crimson4",
  color: "$crimson11",
  borderRadius: "9999px",
  transition: "transform 100ms",
  transform: "translateX(2px)",
  willChange: "transform",
  '&[data-state="checked"]': { transform: "translateX(19px)" },
});

const Flex = styled("div", { display: "flex" });
const Label = styled("label", {
  color: "$crimson12",
  fontSize: 15,
  lineHeight: 1,
  userSelect: "none",
});
const LangSelect = styled("select", {
  marginLeft: 12,
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid $mauve5",
  background: "$mauve1",
  color: "$crimson12",
});
// Create a separate styled component for Link
const StyledLink = styled(Link, {
  flex: 1,
  display: "grid",
  placeContent: "center",
  padding: "$4",
  cursor: "pointer",
  textDecoration: "none",
  width: 20,
  height: 20,
  color: "inherit",

  "&:hover": {
    background: "$mauve3",
  },

  "&:focus, &:active": {
    boxShadow: "0px 0px 2px 0px $mauve10",
  },
});

const MenuBar: React.FunctionComponent = () => {
  const { cart } = useCart();
  const { theme, setTheme } = useTheme();
  const [animate, setAnimate] = useState(false);
  const { t, locale, setLocale } = useI18n();

  return (
    <Wrapper>
      <Popover.Root>
        <Popover.Anchor>
          <MenuBarBox>
            {/* Replace the Link+Item as="a" pattern with StyledLink */}
            <StyledLink href="/" aria-label="Link to Home">
              <HomeIcon />
            </StyledLink>
            <StyledLink href="/cart" aria-label="Link to Cart">
              <Box css={{ position: "relative" }}>
                {cart && (
                  <CartSizeIcon
                    animate={animate}
                    onAnimationEnd={() => setAnimate(false)}
                  >
                    {cart.length}
                  </CartSizeIcon>
                )}
                <ArchiveIcon />
              </Box>
            </StyledLink>
            <Item>
              <StyledTrigger aria-label="Settings">
                <GearIcon />
              </StyledTrigger>
            </Item>
          </MenuBarBox>
          <StyledContent side="top">
            <Flex css={{  gap: "$5" }}>
              <Flex css={{ alignItems: "center", cursor: "pointer"}}>
                <Label htmlFor="s1" css={{ paddingRight: 8, paddingLeft: 0 }}>
                  {t("menu.appearance", "المظهر")}
                </Label>
                <StyledSwitch
                  id="s1"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label="Theme switch"
                >
                  <StyledThumb>
                    {theme === "light" ? <SunIcon /> : <MoonIcon />}
                  </StyledThumb>
                </StyledSwitch>
              </Flex>
              <Flex css={{ alignItems: "center", cursor: "pointer" }}>
                <Label css={{ paddingRight: 8, paddingLeft: 0 }}>{t("menu.language", "اللغة")}</Label>
                <LangSelect
                  css={{ marginLeft: 6 }}
                  aria-label="Select language"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as any)}
                >
                  <option value="en">{t("lang.en", "English")}</option>
                  <option value="ar">{t("lang.ar", "العربية")}</option>
                </LangSelect>
              </Flex>
            </Flex>
            {/* <Popover.Close /> */}
            {/* <Popover.Arrow /> */}
          </StyledContent>
        </Popover.Anchor>
      </Popover.Root>
    </Wrapper>
  );
};

export default MenuBar;
