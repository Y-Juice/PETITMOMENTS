import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { Brand } from "@/constants/theme";
import { FontFamily } from "@/constants/typography";
import { useReports } from "@/contexts/reports-context";
import {
    REPORT_REASON_LABELS,
    type ReportReason,
    type ReportTargetType,
} from "@/data/moderation";
import { useThemeColor } from "@/hooks/use-theme-color";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

type ReportContentButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  variant?: "icon" | "pill";
  iconColor?: string;
  textColor?: string;
};

export function ReportContentButton({
  targetType,
  targetId,
  targetLabel,
  variant = "icon",
  iconColor = Brand.primary,
  textColor,
}: ReportContentButtonProps) {
  const { hasReported, reportContent } = useReports();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );
  const [details, setDetails] = useState("");
  const surfaceText = useThemeColor({}, "text");
  const muted = useThemeColor({}, "icon");
  const panelBg = useThemeColor(
    { light: "#FFFFFF", dark: "#2A2520" },
    "background",
  );
  const inputBg = useThemeColor(
    { light: "rgba(107, 124, 110, 0.08)", dark: "rgba(255,253,226,0.06)" },
    "background",
  );

  const alreadyReported = hasReported(targetType, targetId);
  const labelColor = textColor ?? surfaceText;

  const closeModal = () => {
    if (busy) return;
    setOpen(false);
    setSelectedReason(null);
    setDetails("");
  };

  const onPressReport = () => {
    if (alreadyReported) {
      Alert.alert("Al gemeld", "Je hebt dit item al gerapporteerd.");
      return;
    }
    setOpen(true);
  };

  const onSubmit = async () => {
    if (!selectedReason || busy) return;

    setBusy(true);
    const { error } = await reportContent(
      targetType,
      targetId,
      selectedReason,
      details,
    );
    setBusy(false);

    if (error) {
      Alert.alert("Melding mislukt", error);
      return;
    }

    closeModal();
    Alert.alert(
      "Bedankt",
      "We hebben je melding ontvangen en bekijken deze zo snel mogelijk.",
    );
  };

  return (
    <>
      <Pressable
        onPress={onPressReport}
        disabled={alreadyReported}
        style={({ pressed }) => [
          variant === "icon" ? styles.iconBtn : styles.pillBtn,
          alreadyReported && styles.disabledBtn,
          pressed && styles.pressedBtn,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          alreadyReported
            ? "Item al gerapporteerd"
            : `Rapporteer ${targetLabel}`
        }
      >
        <MaterialIcons
          name={alreadyReported ? "flag" : "outlined-flag"}
          size={variant === "icon" ? 20 : 18}
          color={alreadyReported ? muted : iconColor}
        />
        {variant === "pill" ? (
          <Text style={[styles.pillText, { color: labelColor }]}>
            {alreadyReported ? "Gemeld" : "Rapporteer"}
          </Text>
        ) : null}
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={open}
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: panelBg }]}>
            <Text style={[styles.sheetTitle, { color: surfaceText }]}>
              Rapporteer inhoud
            </Text>
            <Text style={[styles.sheetHelp, { color: muted }]}>
              Waarom wil je "{targetLabel}" melden?
            </Text>

            <ScrollView
              style={styles.reasonList}
              keyboardShouldPersistTaps="handled"
            >
              {REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      active && styles.reasonRowActive,
                      pressed && styles.pressedBtn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        { color: active ? "#FFFFFF" : surfaceText },
                      ]}
                    >
                      {REPORT_REASON_LABELS[reason]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Extra toelichting (optioneel)"
              placeholderTextColor={muted}
              style={[
                styles.detailsInput,
                { color: surfaceText, backgroundColor: inputBg },
              ]}
              editable={!busy}
              multiline
            />

            <View style={styles.sheetActions}>
              <Pressable
                onPress={closeModal}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { borderColor: Brand.neutral },
                  pressed && styles.pressedBtn,
                ]}
              >
                <Text style={[styles.cancelText, { color: surfaceText }]}>
                  Annuleren
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onSubmit()}
                disabled={!selectedReason || busy}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: Brand.primary },
                  (!selectedReason || busy) && styles.disabledBtn,
                  pressed && styles.pressedBtn,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Verstuur melding</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(107, 124, 110, 0.45)",
  },
  pillText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.55,
  },
  pressedBtn: {
    opacity: 0.88,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: "82%",
  },
  sheetTitle: {
    fontFamily: FontFamily.titleBold,
    fontSize: 20,
    marginBottom: 6,
  },
  sheetHelp: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonList: {
    maxHeight: 260,
    marginBottom: 12,
  },
  reasonRow: {
    borderWidth: 1,
    borderColor: "rgba(107, 124, 110, 0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  reasonRowActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  reasonText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "600",
  },
  detailsInput: {
    minHeight: 72,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.body,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitText: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
