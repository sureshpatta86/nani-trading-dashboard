"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  Shield, 
  ArrowDownToLine, 
  ArrowUpToLine,
  Plus, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Banknote,
  PiggyBank,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  reason: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    initialCapital: "0",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Transaction states
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  
  const [depositData, setDepositData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  
  const [withdrawalData, setWithdrawalData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  // Calculate current capital
  const initialCapital = parseFloat(profileData.initialCapital) || 0;
  const currentCapital = initialCapital + totalDeposits - totalWithdrawals;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      fetchUserProfile();
      fetchDeposits();
      fetchWithdrawals();
    }
  }, [status, session, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          initialCapital: data.initialCapital?.toString() || "0",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await fetch("/api/profile/deposits");
      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits || []);
        setTotalDeposits(data.totalDeposits || 0);
      }
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/profile/withdrawals");
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
        setTotalWithdrawals(data.totalWithdrawals || 0);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransactionLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(depositData.amount),
          date: depositData.date,
          reason: depositData.reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: t("depositAdded") });
        setDepositData({
          amount: "",
          date: new Date().toISOString().split("T")[0],
          reason: "",
        });
        setShowDepositForm(false);
        fetchDeposits();
      } else {
        setMessage({ type: "error", text: data.error || t("depositFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransactionLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawalData.amount),
          date: withdrawalData.date,
          reason: withdrawalData.reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: t("withdrawalAdded") });
        setWithdrawalData({
          amount: "",
          date: new Date().toISOString().split("T")[0],
          reason: "",
        });
        setShowWithdrawalForm(false);
        fetchWithdrawals();
      } else {
        setMessage({ type: "error", text: data.error || t("withdrawalFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    } finally {
      setIsTransactionLoading(false);
    }
  };

  const handleDeleteDeposit = async (id: string) => {
    if (!confirm(t("confirmDeleteDeposit"))) return;

    try {
      const response = await fetch(`/api/profile/deposits?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: t("depositDeleted") });
        fetchDeposits();
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || tc("deleteFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    }
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (!confirm(t("confirmDeleteWithdrawal"))) return;

    try {
      const response = await fetch(`/api/profile/withdrawals?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: t("withdrawalDeleted") });
        fetchWithdrawals();
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || tc("deleteFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    }
  };

  const handleResetAllData = async () => {
    if (resetConfirmText !== "RESET") {
      setMessage({ type: "error", text: t("resetConfirmTextError") });
      return;
    }

    setIsResetting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/reset", {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: t("resetSuccess") });
        setShowResetConfirm(false);
        setResetConfirmText("");
        // Refresh all data
        setProfileData(prev => ({ ...prev, initialCapital: "0" }));
        setDeposits([]);
        setWithdrawals([]);
        setTotalDeposits(0);
        setTotalWithdrawals(0);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || t("resetFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    } finally {
      setIsResetting(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          initialCapital: parseFloat(profileData.initialCapital) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: t("profileUpdated") });
        await update({ name: profileData.name });
      } else {
        setMessage({ type: "error", text: data.error || t("updateFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: t("passwordsDoNotMatch") });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: t("passwordTooShort") });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: t("passwordChanged") });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "error", text: data.error || t("changePasswordFailed") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("errorOccurred") });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("loadingProfile")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("description")}
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("profileTab")}</span>
              </TabsTrigger>
              <TabsTrigger value="capital" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">{t("capitalTab")}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t("securityTab")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    {t("profileInformation")}
                  </CardTitle>
                  <CardDescription>
                    {t("updateAccountDetails")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("fullName")}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t("emailAddress")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="h-11 bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("emailCannotBeChanged")}
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {tc("saveChanges")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Capital Management Tab */}
            <TabsContent value="capital" className="space-y-6">
              {/* Capital Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("initialCapitalLabel")}</p>
                        <p className="text-xl font-bold">{formatINR(initialCapital)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("totalDeposits")}</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">+{formatINR(totalDeposits)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("totalWithdrawals")}</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatINR(totalWithdrawals)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("currentCapital")}</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatINR(currentCapital)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Initial Capital Setting */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <PiggyBank className="h-5 w-5 text-white" />
                    </div>
                    {t("setInitialCapital")}
                  </CardTitle>
                  <CardDescription>
                    {t("initialCapitalDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleProfileUpdate} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="initialCapital">{t("initialCapitalAmount")}</Label>
                      <Input
                        id="initialCapital"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="100000"
                        value={profileData.initialCapital}
                        onChange={(e) => setProfileData({ ...profileData, initialCapital: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {tc("save")}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Deposits Section */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                        <ArrowUpToLine className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>{t("deposits")}</CardTitle>
                        <CardDescription>
                          {t("depositsDescription")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDepositForm(!showDepositForm);
                        setShowWithdrawalForm(false);
                      }}
                      className="gap-2 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Plus className="h-4 w-4" />
                      {t("addFunds")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Add Deposit Form */}
                  {showDepositForm && (
                    <form onSubmit={handleAddDeposit} className="mb-6 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                      <h4 className="font-medium mb-4 text-green-700 dark:text-green-400">{t("addDeposit")}</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="depositAmount">{t("depositAmount")}</Label>
                          <Input
                            id="depositAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10000"
                            value={depositData.amount}
                            onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="depositDate">{t("depositDate")}</Label>
                          <Input
                            id="depositDate"
                            type="date"
                            value={depositData.date}
                            onChange={(e) => setDepositData({ ...depositData, date: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="depositReason">{t("depositReason")}</Label>
                        <Textarea
                          id="depositReason"
                          placeholder={t("depositReasonPlaceholder")}
                          value={depositData.reason}
                          onChange={(e) => setDepositData({ ...depositData, reason: e.target.value })}
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="submit"
                          disabled={isTransactionLoading}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {isTransactionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {t("addDeposit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDepositForm(false)}
                        >
                          {tc("cancel")}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Deposits List */}
                  {deposits.length > 0 ? (
                    <div className="space-y-3">
                      {deposits.map((deposit) => (
                        <div
                          key={deposit.id}
                          className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <ArrowUpToLine className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                +{formatINR(deposit.amount)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(deposit.date).toLocaleDateString()}
                              </div>
                              {deposit.reason && (
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs truncate">
                                  {deposit.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteDeposit(deposit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowUpToLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("noDeposits")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Withdrawals Section */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-600/10 to-pink-600/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                        <ArrowDownToLine className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>{t("withdrawals")}</CardTitle>
                        <CardDescription>
                          {t("withdrawalsDescription")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowWithdrawalForm(!showWithdrawalForm);
                        setShowDepositForm(false);
                      }}
                      className="gap-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Plus className="h-4 w-4" />
                      {t("withdrawFunds")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Add Withdrawal Form */}
                  {showWithdrawalForm && (
                    <form onSubmit={handleAddWithdrawal} className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                      <h4 className="font-medium mb-4 text-red-700 dark:text-red-400">{t("addWithdrawal")}</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="withdrawalAmount">{t("withdrawalAmount")}</Label>
                          <Input
                            id="withdrawalAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10000"
                            value={withdrawalData.amount}
                            onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="withdrawalDate">{t("withdrawalDate")}</Label>
                          <Input
                            id="withdrawalDate"
                            type="date"
                            value={withdrawalData.date}
                            onChange={(e) => setWithdrawalData({ ...withdrawalData, date: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="withdrawalReason">{t("withdrawalReason")}</Label>
                        <Textarea
                          id="withdrawalReason"
                          placeholder={t("withdrawalReasonPlaceholder")}
                          value={withdrawalData.reason}
                          onChange={(e) => setWithdrawalData({ ...withdrawalData, reason: e.target.value })}
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="submit"
                          disabled={isTransactionLoading}
                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                        >
                          {isTransactionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {t("addWithdrawal")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowWithdrawalForm(false)}
                        >
                          {tc("cancel")}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Withdrawals List */}
                  {withdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {withdrawals.map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <ArrowDownToLine className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-red-600 dark:text-red-400">
                                -{formatINR(withdrawal.amount)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(withdrawal.date).toLocaleDateString()}
                              </div>
                              {withdrawal.reason && (
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs truncate">
                                  {withdrawal.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowDownToLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("noWithdrawals")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {session?.user?.email && !session?.user?.image ? (
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-600/10 to-orange-600/10">
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      {t("changePassword")}
                    </CardTitle>
                    <CardDescription>
                      {t("changePasswordDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          required
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{t("newPassword")}</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          required
                          minLength={6}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("passwordMinLength")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          required
                          minLength={6}
                          className="h-11"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        {t("changePassword")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      {t("password")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      {t("oauthPasswordNote")}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Reset Data Section */}
              <Card className="overflow-hidden border-0 shadow-lg border-red-200 dark:border-red-900/50">
                <CardHeader className="bg-gradient-to-r from-red-600/10 to-rose-600/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    {t("resetData")}
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-400">
                    {t("resetDataDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {!showResetConfirm ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-medium text-red-700 dark:text-red-400">{t("resetWarningTitle")}</p>
                            <ul className="list-disc pl-4 text-red-600/80 dark:text-red-400/80 space-y-1">
                              <li>{t("resetWarning1")}</li>
                              <li>{t("resetWarning2")}</li>
                              <li>{t("resetWarning3")}</li>
                              <li>{t("resetWarning4")}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => setShowResetConfirm(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t("resetButton")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl p-4">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-3">
                          {t("resetConfirmMessage")}
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="resetConfirm" className="text-red-700 dark:text-red-400">
                            {t("resetConfirmLabel")}
                          </Label>
                          <Input
                            id="resetConfirm"
                            type="text"
                            placeholder="RESET"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
                            className="h-11 border-red-300 dark:border-red-800 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowResetConfirm(false);
                            setResetConfirmText("");
                          }}
                        >
                          {tc("cancel")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleResetAllData}
                          disabled={isResetting || resetConfirmText !== "RESET"}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isResetting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          {t("confirmReset")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
