import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminReportRow } from "@/components/admin-report-row";
import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useAdmin } from "@/contexts/admin-context";
import type { ReportStatus } from "@/data/moderation";
import { useThemeColor } from "@/hooks/use-theme-color";

type FilterKey = ReportStatus | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Open" },
  { key: "all", label: "Alles" },
  { key: "reviewed", label: "Bekeken" },
  { key: "dismissed", label: "Afgewezen" },
  { key: "action_taken", label: "Actie" },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const {
    reports,
    reportsLoading,
    reportsError,
    statusFilter,
    setStatusFilter,
    refreshReports,
  } = useAdmin();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const borderColor = useThemeColor(
    { light: "#E2E2E2", dark: "#343434" },
    "text",
  );
  const tint = useThemeColor({}, "tint");
  const activeFilterLabel =
    FILTERS.find((filter) => filter.key === statusFilter)?.label ?? "Alles";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Terug"
        >
          <MaterialIcons name="arrow-back" size={22} color={textColor} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: textColor }]}>Moderatie</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            Beheer meldingen van gebruikers
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor }]}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {reports.length}
          </Text>
          <Text style={[styles.statLabel, { color: muted }]}>Meldingen</Text>
        </View>
        <View style={[styles.statCard, { borderColor }]}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {activeFilterLabel}
          </Text>
          <Text style={[styles.statLabel, { color: muted }]}>Filter</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setStatusFilter(filter.key)}
              style={[
                styles.filterChip,
                { borderColor },
                active && { backgroundColor: tint, borderColor: tint },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? "#FFFFFF" : textColor },
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={reportsLoading}
            onRefresh={() => void refreshReports()}
            tintColor={Brand.primary}
          />
        }
      >
        {reportsError ? (
          <Text style={[styles.errorText, { color: Brand.primary }]}>
            {reportsError}
          </Text>
        ) : null}

        {reportsLoading && reports.length === 0 ? (
          <ActivityIndicator color={Brand.primary} style={styles.loader} />
        ) : null}

        {!reportsLoading && reports.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor }]}>
            <MaterialIcons name="inbox" size={28} color={muted} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              Geen meldingen
            </Text>
            <Text style={[styles.emptyText, { color: muted }]}>
              Er zijn geen meldingen voor dit filter.
            </Text>
          </View>
        ) : null}

        {reports.map((report) => (
          <AdminReportRow key={report.id} report={report} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.titleBold,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statValue: {
    fontFamily: FontFamily.titleBold,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipText: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  loader: {
    marginTop: 24,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
