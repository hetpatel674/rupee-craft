import React, { useState } from 'react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Upload, 
  Trash2, 
  Info, 
  Database,
  FileText,
  Shield,
  Palette,
  Moon,
  BarChart3,
  Grid3X3,
  Tag,
  FolderOpen,
  ExternalLink,
  CheckCircle,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import PreviousDataAnalytics from '@/components/PreviousDataAnalytics';
import CategoriesView from '@/components/CategoriesView';

const Settings: React.FC = () => {
  const { transactions } = useExpense();
  const { toast } = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [showPreviousAnalytics, setShowPreviousAnalytics] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const [isImportWarningOpen, setIsImportWarningOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [importValidationError, setImportValidationError] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<{
    filename: string;
    path: string;
    size: string;
  } | null>(null);
  const [isExportSuccessDialogOpen, setIsExportSuccessDialogOpen] = useState(false);

  const handleExportData = () => {
    if (!customFilename.trim()) {
      toast({
        title: "Filename required",
        description: "Please enter a filename for your export.",
        variant: "destructive"
      });
      return;
    }

    try {
      const dataToExport = {
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = customFilename.endsWith('.json') ? customFilename : `${customFilename}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Calculate file size
      const fileSizeKB = Math.round((jsonString.length / 1024) * 100) / 100;
      const fileSize = fileSizeKB < 1024 ? `${fileSizeKB} KB` : `${Math.round((fileSizeKB / 1024) * 100) / 100} MB`;

      // Get download path (typically Downloads folder)
      const downloadPath = navigator.userAgent.includes('Windows') 
        ? `C:\\Users\\${navigator.userAgent.split('Windows NT')[0] || 'User'}\\Downloads\\${filename}`
        : navigator.userAgent.includes('Mac')
        ? `/Users/${navigator.userAgent.split('Mac OS X')[0] || 'user'}/Downloads/${filename}`
        : `/home/${navigator.userAgent.split('Linux')[0] || 'user'}/Downloads/${filename}`;

      // Set export success data
      setExportSuccess({
        filename,
        path: downloadPath,
        size: fileSize
      });

      setIsExportDialogOpen(false);
      setCustomFilename('');
      setIsExportSuccessDialogOpen(true);

    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting your data.",
        variant: "destructive"
      });
    }
  };

  const validateImportFile = (file: File): Promise<{ isValid: boolean; data?: any; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
            resolve({ isValid: false, error: 'Invalid file format - missing transactions array' });
            return;
          }

          const validTransactions = importedData.transactions.filter((t: any) => 
            t.id && t.type && t.amount && t.category && t.date
          );

          if (validTransactions.length === 0) {
            resolve({ isValid: false, error: 'No valid transactions found in file' });
            return;
          }

          const hasInvalidTransactions = importedData.transactions.length > validTransactions.length;
          
          resolve({ 
            isValid: true, 
            data: { ...importedData, validTransactions, hasInvalidTransactions }
          });
        } catch (error) {
          resolve({ isValid: false, error: 'Invalid JSON format' });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImportFile(file);
    
    if (transactions.length > 0) {
      // Show warning dialog if there's existing data
      setIsImportWarningOpen(true);
    } else {
      // Proceed directly if no existing data
      processImportFile(file);
    }
    
    // Clear the input
    event.target.value = '';
    setIsImportDialogOpen(false);
  };

  const processImportFile = async (file: File) => {
    const validation = await validateImportFile(file);
    
    if (!validation.isValid) {
      setImportValidationError(validation.error || 'Unknown validation error');
      setIsImportWarningOpen(true);
      return;
    }

    const { validTransactions, hasInvalidTransactions } = validation.data;

    if (hasInvalidTransactions) {
      setImportValidationError(`File contains some invalid transactions. Only ${validTransactions.length} valid transactions will be imported.`);
      setIsImportWarningOpen(true);
      return;
    }

    // Import the data
    localStorage.setItem('expense-tracker-transactions', JSON.stringify(validTransactions));
    
    toast({
      title: "Import successful",
      description: `Imported ${validTransactions.length} transactions. Refreshing app...`,
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleConfirmImport = () => {
    if (pendingImportFile) {
      processImportFile(pendingImportFile);
    }
    setIsImportWarningOpen(false);
    setPendingImportFile(null);
    setImportValidationError(null);
  };

  const handleCancelImport = () => {
    setIsImportWarningOpen(false);
    setPendingImportFile(null);
    setImportValidationError(null);
  };

  const handleClearAllData = () => {
    localStorage.removeItem('expense-tracker-transactions');
    window.location.reload();
  };

  const handleOpenFileLocation = () => {
    if (!exportSuccess) return;
    
    // Try to open the Downloads folder
    if (navigator.userAgent.includes('Windows')) {
      // For Windows, try to open Downloads folder
      window.open('file:///C:/Users/' + (process.env.USERNAME || 'User') + '/Downloads/', '_blank');
    } else if (navigator.userAgent.includes('Mac')) {
      // For Mac, try to open Downloads folder
      window.open('file:///Users/' + (process.env.USER || 'user') + '/Downloads/', '_blank');
    } else {
      // For Linux/other systems
      window.open('file:///home/' + (process.env.USER || 'user') + '/Downloads/', '_blank');
    }
    
    toast({
      title: "Opening Downloads folder",
      description: "Your browser will attempt to open the Downloads folder.",
    });
  };

  const handleCopyPath = async () => {
    if (!exportSuccess) return;
    
    try {
      await navigator.clipboard.writeText(exportSuccess.path);
      toast({
        title: "Path copied",
        description: "File path has been copied to clipboard.",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = exportSuccess.path;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Path copied",
        description: "File path has been copied to clipboard.",
      });
    }
  };

  const settingSections = [
    {
      title: 'Data Management',
      icon: Database,
      items: [
        {
          title: 'Export Data',
          description: 'Download your transaction data as backup',
          icon: Download,
          action: () => {
            setCustomFilename(`expense-backup-${new Date().toISOString().split('T')[0]}`);
            setIsExportDialogOpen(true);
          },
          disabled: transactions.length === 0,
        },
        {
          title: 'Import Data',
          description: 'Restore data from a backup file',
          icon: Upload,
          action: () => setIsImportDialogOpen(true),
        },
        {
          title: 'Previous Data Analytics',
          description: 'Analyze uploaded JSON files with detailed charts',
          icon: BarChart3,
          action: () => setShowPreviousAnalytics(true),
        },
        {
          title: 'Manage Categories',
          description: 'View and organize transaction categories',
          icon: Grid3X3,
          action: () => setShowCategories(true),
        },
        {
          title: 'Clear All Data',
          description: 'Delete all transactions permanently',
          icon: Trash2,
          action: () => setIsClearDialogOpen(true),
          danger: true,
          disabled: transactions.length === 0,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          title: 'Dark Mode',
          description: 'Currently enabled (cannot be changed)',
          icon: Moon,
          disabled: true,
        },
      ],
    },
    {
      title: 'About',
      icon: Info,
      items: [
        {
          title: 'App Version',
          description: '1.0.0',
          icon: FileText,
          disabled: true,
        },
        {
          title: 'Privacy',
          description: 'All data is stored locally on your device',
          icon: Shield,
          disabled: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-card-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your app preferences and data</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* App Stats */}
        <div className="glass-card p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">App Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-income">
                {transactions.filter(t => t.type === 'income').length}
              </p>
              <p className="text-sm text-muted-foreground">Income Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-expense">
                {transactions.filter(t => t.type === 'expense').length}
              </p>
              <p className="text-sm text-muted-foreground">Expense Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {Math.round((JSON.stringify(transactions).length / 1024) * 100) / 100}
              </p>
              <p className="text-sm text-muted-foreground">Data Size (KB)</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <div key={section.title} className="glass-card p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <section.icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{section.title}</h3>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg transition-all duration-200",
                    "bg-card/30 border border-card-border",
                    !item.disabled && "hover:bg-card/50 cursor-pointer",
                    item.disabled && "opacity-60"
                  )}
                  onClick={!item.disabled ? item.action : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      item.danger ? "bg-destructive/20" : "bg-primary/20"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        item.danger ? "text-destructive" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="glass-card border-card-border">
          <DialogHeader>
            <DialogTitle>Export Transaction Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                This will download a JSON file containing all your transaction data. 
                Keep this file safe as a backup.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <div>
                <Label htmlFor="filename">Custom Filename</Label>
                <Input
                  id="filename"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="Enter filename (without .json extension)"
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleExportData}
                  className="flex-1 btn-primary-glass"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsExportDialogOpen(false);
                    setCustomFilename('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="glass-card border-card-border">
          <DialogHeader>
            <DialogTitle>Import Transaction Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Select a JSON backup file to restore your transaction data. 
                {transactions.length > 0 && "This will replace your current data."}
              </AlertDescription>
            </Alert>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Warning Dialog */}
      <Dialog open={isImportWarningOpen} onOpenChange={setIsImportWarningOpen}>
        <DialogContent className="glass-card border-card-border">
          <DialogHeader>
            <DialogTitle>
              {importValidationError ? "Import Warning" : "Replace Existing Data?"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant={importValidationError ? "destructive" : "default"}>
              <Info className="w-4 h-4" />
              <AlertDescription>
                {importValidationError || 
                  `You have ${transactions.length} existing transactions. Importing this file will permanently replace all your current data. This action cannot be undone.`
                }
              </AlertDescription>
            </Alert>
            <div className="flex space-x-3">
              <Button 
                onClick={handleConfirmImport}
                variant={importValidationError ? "destructive" : "default"}
                className="flex-1"
              >
                {importValidationError ? "Import Anyway" : "Yes, Replace Data"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelImport}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="glass-card border-card-border">
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Trash2 className="w-4 h-4" />
              <AlertDescription>
                This action cannot be undone. All your transaction data will be permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="flex space-x-3">
              <Button 
                variant="destructive"
                onClick={handleClearAllData}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsClearDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Previous Data Analytics Modal */}
      {showPreviousAnalytics && (
        <div className="fixed inset-0 z-50 bg-background">
          <PreviousDataAnalytics 
            onClose={() => setShowPreviousAnalytics(false)}
            currentTransactions={transactions}
          />
        </div>
      )}

      {/* Export Success Dialog */}
      <Dialog open={isExportSuccessDialogOpen} onOpenChange={setIsExportSuccessDialogOpen}>
        <DialogContent className="glass-card border-card-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-income" />
              Export Successful
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-income/20 bg-income/5">
              <Download className="w-4 h-4 text-income" />
              <AlertDescription className="text-foreground">
                Your transaction data has been successfully exported!
              </AlertDescription>
            </Alert>
            
            {exportSuccess && (
              <div className="space-y-3">
                <div className="glass-card p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Filename:</span>
                    <span className="text-sm font-medium">{exportSuccess.filename}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Size:</span>
                    <span className="text-sm font-medium">{exportSuccess.size}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded text-xs font-mono break-all">
                      <span className="flex-1">{exportSuccess.path}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyPath}
                        className="h-6 w-6 p-0 hover:bg-primary/10"
                        title="Copy path"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenFileLocation}
                    className="flex-1 btn-primary-glass"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open Location
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsExportSuccessDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Modal */}
      {showCategories && (
        <div className="fixed inset-0 z-50 bg-background">
          <CategoriesView onClose={() => setShowCategories(false)} />
        </div>
      )}
    </div>
  );
};

export default Settings;