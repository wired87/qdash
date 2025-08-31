import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/react";

export const DataTable = (
  rows,
  keys
) => {
  if (!rows?.length || !keys.length) return <></>

  return (
    <Table
      aria-label="Dynamic table"
      color="default"             // "default" | "primary" | "secondary" | "success" | "warning" | "danger"
      fullWidth={true}
      hideHeader={false}
      isCompact={false}
      isHeaderSticky={false}
      isMultiSelectable={false}
      isSelectable={false}
      isStriped={false}
      layout="auto"               // "auto" | "fixed"
      radius="md"                 // "none" | "sm" | "md" | "lg" | "full"
      shadow="none"               // "none" | "sm" | "md" | "lg"
      >

      <TableHeader>
        {keys.map((key) => (
          <TableColumn key={key}>{key}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={idx}>
            {keys.map((key) => (
              <TableCell key={key}>{row?[key] : null}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
