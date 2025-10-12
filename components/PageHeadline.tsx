import { styled, Box } from "../stitches.config";

const Headline = styled("h1", {
  all: "unset",
  color: "$crimson12",
  fontSize: "36px",
  lineHeight: "34px",
  fontFamily: "Cairo, sans serif",

  // reduce size on small screens
  '@media (max-width: 600px)': {
    fontSize: "32px",
  },
});

type PageHeadlineProps = {
  children: React.ReactNode;
};
const PageHeadline: React.FunctionComponent<PageHeadlineProps> = ({ children }) => (
  <Box
    css={{
      borderBottom: "1px solid $mauve4",
      paddingLeft: "$4",
      marginLeft: "-$4",
      paddingRight: "$5",
      marginRight: "-$4",
      marginBottom: "$4",
      paddingTop: "$4",
      paddingBottom: "$4",
    }}
  >
    <Headline>{children}</Headline>
  </Box>
);

export default PageHeadline;
