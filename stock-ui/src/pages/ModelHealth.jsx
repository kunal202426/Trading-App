import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function ModelHealth() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontWeight: 800, color: "primary.main", mb: 2 }}
        >
          Model Health
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary" }}>
          Drift monitoring &amp; model diagnostics coming soon
        </Typography>
      </Box>
    </motion.div>
  );
}
