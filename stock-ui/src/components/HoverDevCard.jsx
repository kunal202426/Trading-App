import React from "react";
import { Paper, Box } from "@mui/material";

export default function HoverDevCard({ children, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        cursor: "pointer",
        "&:hover .hover-bg": {
          transform: "translateY(0%)",
        },
      }}
    >
    
      <Box
        className="hover-bg"
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, #fefefe, #d3eaf7)",
          transform: "translateY(100%)",
          transition: "transform 0.38s",
          zIndex: 0,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          position: "relative",
          zIndex: 1,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          background: "transparent",
          transition: "color 0.3s",
          "&:hover": {
            color: "white",
          },
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}