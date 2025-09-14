import React, { useState, useMemo } from 'react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Search, 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  Grid3X3,
  Package,
  DollarSign,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/types/expense';

interface CategoriesViewProps {
  onClose: () => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ onClose }) => {
  const { transactions, getCategoryTotals, getAllCategories, addCustomCategory } = useExpense();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📝',
    color: '#4ECDC4',
    type: 'expense' as 'income' | 'expense'
  });

  const categoryTotals = getCategoryTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredCategories = useMemo(() => {
    let categories = getAllCategories().filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || 
        category.type === filterType || 
        category.type === 'both';
      
      return matchesSearch && matchesType;
    });

    // Sort by usage (categories with transactions first, then alphabetically)
    return categories.sort((a, b) => {
      const aHasTransactions = categoryTotals[a.name] ? 1 : 0;
      const bHasTransactions = categoryTotals[b.name] ? 1 : 0;
      
      if (aHasTransactions !== bHasTransactions) {
        return bHasTransactions - aHasTransactions;
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, filterType, categoryTotals]);

  const getUsageStats = () => {
    const totalCategories = getAllCategories().length;
    const usedCategories = Object.keys(categoryTotals).length;
    const totalTransactions = transactions.length;
    
    return {
      totalCategories,
      usedCategories,
      totalTransactions,
      unusedCategories: totalCategories - usedCategories
    };
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    // Check if category name already exists
    const existingCategory = getAllCategories().find(
      cat => cat.name.toLowerCase() === newCategory.name.toLowerCase()
    );
    
    if (existingCategory) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      addCustomCategory(newCategory);
      toast({
        title: "Success",
        description: `Category "${newCategory.name}" has been added successfully`
      });
      
      // Reset form
      setNewCategory({
        name: '',
        icon: '📝',
        color: '#4ECDC4',
        type: 'expense'
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const predefinedIcons = ['📝', '💼', '🏠', '🚗', '🍽️', '🛒', '🎬', '💡', '🏥', '📚', '✈️', '💄', '🎁', '💰', '📈', '🏢'];
  const predefinedColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#26de81', '#2bcbba', '#0fb9b1', '#20bf6b'];

  const stats = getUsageStats();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Categories
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage and organize your transaction categories
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a custom category for your transactions
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 modal-content">
                <div className="space-y-6 py-4">
                {/* Category Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Category Name
                  </Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    className="w-full"
                  />
                </div>

                {/* Category Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Category Type
                  </Label>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setNewCategory(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="w-full glass-card border-card-border bg-background/50 text-foreground">
                      <SelectValue placeholder="Select category type">
                        <div className="flex items-center gap-2">
                          {newCategory.type === 'expense' ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-expense" />
                              <span className="text-foreground font-medium">Expense</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 text-income" />
                              <span className="text-foreground font-medium">Income</span>
                            </>
                          )}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="glass-card border-card-border bg-background/95 backdrop-blur-md">
                      <SelectItem value="expense" className="hover:bg-expense/10 focus:bg-expense/10 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-expense" />
                          <span className="text-foreground">Expense</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="income" className="hover:bg-income/10 focus:bg-income/10 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-income" />
                          <span className="text-foreground">Income</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Icon Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Choose Icon
                  </Label>
                  <div className="space-y-3">
                    {/* Selected Icon Preview */}
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                        style={{ backgroundColor: `${newCategory.color}20`, borderColor: newCategory.color }}
                      >
                        {newCategory.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Selected Icon</p>
                        <p className="text-xs text-muted-foreground">Preview of your category</p>
                      </div>
                    </div>
                    
                    {/* Icon Grid */}
                    <div className="grid grid-cols-8 gap-2">
                      {predefinedIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl hover:bg-muted transition-all",
                            newCategory.icon === icon ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Icon Input */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Or enter custom emoji</Label>
                      <Input
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="🎯"
                        className="text-center text-xl h-12"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Choose Color
                  </Label>
                  <div className="space-y-3">
                    {/* Color Grid */}
                    <div className="grid grid-cols-6 gap-3">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                          className={cn(
                            "w-12 h-12 rounded-lg border-4 transition-all hover:scale-110",
                            newCategory.color === color ? "border-white shadow-lg scale-110" : "border-transparent hover:border-white/50"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* Custom Color Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Or pick custom color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="w-16 h-12 p-1 border-2"
                        />
                        <Input
                          type="text"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="#4ECDC4"
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
              <DialogFooter className="flex gap-3 pt-6 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddCategory}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!newCategory.name.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {stats.totalCategories}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Categories</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-income">
              {stats.usedCategories}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Categories Used</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-muted-foreground">
              {stats.unusedCategories}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Unused</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-accent">
              {stats.totalTransactions}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((category) => {
          const categoryData = categoryTotals[category.name];
          const isUsed = !!categoryData;

          return (
            <Card 
              key={category.id} 
              className={cn(
                "glass-card transition-all duration-200",
                isUsed ? "border-primary/20 hover:border-primary/40" : "opacity-75"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={category.type === 'income' ? 'default' : 
                               category.type === 'expense' ? 'destructive' : 'secondary'} 
                        className="text-xs"
                      >
                        {category.type === 'income' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {category.type === 'expense' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {category.type === 'both' && <Package className="w-3 h-3 mr-1" />}
                        {category.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {isUsed ? (
                  <div className="space-y-2 pt-3 border-t border-card-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium text-primary">
                        {formatCurrency(categoryData.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Transactions:</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryData.count}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-card-border text-center">
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No categories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesView;