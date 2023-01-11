import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MaterialReactTable, {
  MRT_Row,
  MaterialReactTableProps,
  MRT_Cell,
} from "material-react-table";
import { Box, Button, IconButton, Tooltip } from "@mui/material";

import type { MRT_ColumnDef } from "material-react-table";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { ExportToCsv } from "export-to-csv";
import { useCallback, useMemo, useState } from "react";

import CreateNewAccountModal from "./CreateUserModal";
import { Delete, Edit } from "@mui/icons-material";
import { createUser, deleteUser, fetchUsers, updateUser } from "../utils/api";

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
};

const MTable = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<User[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});

  const { isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    onSuccess: setTableData,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
  const updateUserMutation = useMutation({
    mutationFn: updateUser,
  });
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
  });

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<User>
    ): MRT_ColumnDef<User>["muiTableBodyCellEditTextFieldProps"] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid = validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "_id",
        header: "ID",
        enableColumnOrdering: false,
        enableEditing: false, //disable editing on this column
        enableSorting: false,
      },
      {
        accessorKey: "firstName",
        header: "First Name",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
    ],
    []
  );

  // Exporting
  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: columns.map((c) => c.header),
  };

  const csvExporter = new ExportToCsv(csvOptions);

  const handleExportRows = (rows: MRT_Row<User>[]) => {
    csvExporter.generateCsv(rows.map((row) => row.original));
  };

  const handleExportData = () => {
    csvExporter.generateCsv(tableData);
  };

  // CRUD
  const handleCreateNewRow = (values: User) => {
    createUserMutation.mutate(values);
  };

  const handleSaveRowEdits: MaterialReactTableProps<User>["onEditingRowSave"] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        //send/receive api updates here, then refetch or update local table data for re-render
        updateUserMutation.mutate(values);
        tableData[row.index] = values;
        setTableData([...tableData]);
        exitEditingMode(); //required to exit editing mode and close modal
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row: MRT_Row<User>) => {
      if (
        !confirm(`Are you sure you want to delete ${row.getValue("firstName")}`)
      ) {
        return;
      }
      //send api delete request here, then refetch or update local table data for re-render
      deleteUserMutation.mutate(row.getValue("_id"));
      setTableData((_tableData) => {
        _tableData.splice(row.index, 1);
        return [..._tableData];
      });
    },
    [tableData]
  );

  // if (isLoading) return <h1>Loading</h1>;

  return (
    <>
      <div className="h-screen p-20 bg-gray-100">
        <MaterialReactTable
          displayColumnDefOptions={{
            "mrt-row-actions": {
              muiTableHeadCellProps: {
                align: "center",
              },
              size: 120,
            },
          }}
          columns={columns}
          data={tableData}
          state={{ isLoading }}
          enableGrouping
          enableStickyHeader
          enableRowSelection
          editingMode="modal" //default
          enableColumnOrdering
          enableEditing
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Box sx={{ display: "flex", gap: "1rem" }}>
              <Tooltip arrow placement="left" title="Edit">
                <IconButton onClick={() => table.setEditingRow(row)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement="right" title="Delete">
                <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          positionToolbarAlertBanner="bottom"
          renderTopToolbarCustomActions={({ table }) => (
            <>
              <Box
                sx={{
                  display: "flex",
                  gap: "1rem",
                  p: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  color="primary"
                  //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
                  onClick={handleExportData}
                  startIcon={<FileDownloadIcon />}
                  variant="contained"
                >
                  Export All Data
                </Button>
                <Button
                  disabled={table.getPrePaginationRowModel().rows.length === 0}
                  //export all rows, including from the next page, (still respects filtering and sorting)
                  onClick={() =>
                    handleExportRows(table.getPrePaginationRowModel().rows)
                  }
                  startIcon={<FileDownloadIcon />}
                  variant="contained"
                >
                  Export All Rows
                </Button>
                <Button
                  disabled={table.getRowModel().rows.length === 0}
                  //export all rows as seen on the screen (respects pagination, sorting, filtering, etc.)
                  onClick={() => handleExportRows(table.getRowModel().rows)}
                  startIcon={<FileDownloadIcon />}
                  variant="contained"
                >
                  Export Page Rows
                </Button>
                <Button
                  disabled={
                    !table.getIsSomeRowsSelected() &&
                    !table.getIsAllRowsSelected()
                  }
                  //only export selected rows
                  onClick={() =>
                    handleExportRows(table.getSelectedRowModel().rows)
                  }
                  startIcon={<FileDownloadIcon />}
                  variant="contained"
                >
                  Export Selected Rows
                </Button>
                <Button
                  color="secondary"
                  onClick={() => setCreateModalOpen(true)}
                  variant="contained"
                >
                  Create New Account
                </Button>
              </Box>
            </>
          )}
        />
      </div>
      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};
const validateRequired = (value: string) => !!value.length;

export default MTable;
