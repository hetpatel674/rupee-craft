import React, { useState } from 'react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Edit, BarChart3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultCategories } from '@/constants/categories';

const Categories: React.FC = () => {
  const { getCategoryTotals, getAllCategories, addCustomCategory, deleteCustomCategory } = useExpense();
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('💰');

  const categoryTotals = getCategoryTotals();

  const getFilteredCategories = () => {
    let categories = getAllCategories();
    if (selectedType !== 'all') {
      categories = categories.filter(cat => cat.type === selectedType || cat.type === 'both');
    }
    return categories;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryUsage = (categoryName: string) => {
    return categoryTotals[categoryName] || { total: 0, count: 0 };
  };

  const isCustomCategory = (categoryId: string) => {
    // Predefined categories have numeric IDs, custom categories have generated IDs
    return !defaultCategories.some(cat => cat.id === categoryId);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const usage = getCategoryUsage(categoryName);
    if (usage.count > 0) {
      if (!confirm(`This category "${categoryName}" has ${usage.count} transactions. Deleting it will not affect existing transactions, but the category won't be available for new transactions. Are you sure?`)) {
        return;
      }
    }
    deleteCustomCategory(categoryId);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // Add the category using the context method
    addCustomCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: '#4ECDC4', // Default color
      type: 'expense' // Default type
    });
    
    setIsAddDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryIcon('💰');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="filter-tabs-container">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Categories</h1>
              <p className="text-muted-foreground">Manage your transaction categories</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary-glass">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-card-border">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category Name</label>
                    <Input
                      placeholder="Enter category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="glass-card border-card-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <Input
                      placeholder="Choose an emoji"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="glass-card border-card-border"
                    />
                  </div>
                  <Button 
                    onClick={handleAddCategory}
                    className="w-full btn-primary-glass"
                    disabled={!newCategoryName.trim()}
                  >
                    Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All Categories', icon: BarChart3 },
              { key: 'income', label: 'Income', icon: TrendingUp },
              { key: 'expense', label: 'Expense', icon: TrendingDown },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key as typeof selectedType)}
                className={cn(
                  "filter-tab",
                  selectedType === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getFilteredCategories().map((category) => {
            const usage = getCategoryUsage(category.name);
            const isUsed = usage.count > 0;

            return (
              <div
                key={category.id}
                className={cn(
                  "glass-card p-4 rounded-lg transition-all duration-200 hover:scale-105",
                  category.type === 'income' ? "card-success" : "card-expense",
                  !isUsed && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                        category.type === 'income' ? "bg-income/20" : "bg-expense/20"
                      )}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {category.type}
                        {isCustomCategory(category.id) && (
                          <span className="ml-1 text-primary">• Custom</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isCustomCategory(category.id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete custom category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isUsed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total spent</span>
                      <span className={cn(
                        "text-sm font-semibold",
                        category.type === 'income' ? "text-income" : "text-expense"
                      )}>
                        {formatCurrency(usage.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transactions</span>
                      <span className="text-sm font-medium text-foreground">
                        {usage.count}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {getFilteredCategories().length === 0 && (
          <div className="glass-card p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground">
              Try changing the filter or add a new category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;