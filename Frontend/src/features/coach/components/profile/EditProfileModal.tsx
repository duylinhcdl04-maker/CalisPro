import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { CoachProfile } from "../../types";
import { useUpdateCoachProfile } from "../../hooks";
import { Button3D, Field, Modal, TextArea, TextInput } from "../ui";
import { SpecializationInput } from "./SpecializationInput";

const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự.").max(60, "Họ tên tối đa 60 ký tự."),
  phone: z
    .string()
    .trim()
    .refine((v) => VN_PHONE.test(v.replace(/[\s.]/g, "")), "Số điện thoại Việt Nam không hợp lệ (ví dụ 0912 345 678)."),
  bio: z.string().trim().max(600, "Giới thiệu tối đa 600 ký tự."),
  experienceYears: z.number({ message: "Vui lòng nhập số năm kinh nghiệm." }).int("Số năm phải là số nguyên.").min(0, "Tối thiểu 0 năm.").max(50, "Tối đa 50 năm."),
  location: z.string().trim().max(80, "Địa điểm tối đa 80 ký tự."),
  specializations: z.array(z.string()).max(12, "Tối đa 12 chuyên môn."),
});

type ProfileForm = z.infer<typeof profileSchema>;

const toForm = (p: CoachProfile): ProfileForm => ({
  name: p.name,
  phone: p.phone,
  bio: p.bio,
  experienceYears: p.experienceYears,
  location: p.location,
  specializations: p.specializations,
});

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CoachProfile;
}

export function EditProfileModal({ open, onOpenChange, profile }: EditProfileModalProps) {
  const update = useUpdateCoachProfile();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: toForm(profile) });

  useEffect(() => {
    if (open) reset(toForm(profile));
  }, [open, profile, reset]);

  const busy = update.isPending;
  const bioLength = watch("bio")?.length ?? 0;

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: () => {
        toast.success("Đã cập nhật hồ sơ.");
        onOpenChange(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể cập nhật hồ sơ."),
    });
  });

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="Chỉnh sửa hồ sơ"
      description="Thông tin hiển thị với học viên và quản trị viên."
      size="lg"
      footer={
        <>
          <Button3D variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button3D>
          <Button3D variant="primary" type="submit" form="profile-form" loading={busy} disabled={!isDirty}>
            Lưu hồ sơ
          </Button3D>
        </>
      }
    >
      <form id="profile-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Họ tên" required error={errors.name?.message}>
          {(id, d) => <TextInput id={id} aria-describedby={d} aria-invalid={!!errors.name} autoComplete="name" disabled={busy} {...register("name")} />}
        </Field>
        <Field label="Số điện thoại" required error={errors.phone?.message}>
          {(id, d) => <TextInput id={id} type="tel" inputMode="tel" aria-describedby={d} aria-invalid={!!errors.phone} autoComplete="tel" disabled={busy} {...register("phone")} />}
        </Field>
        <Field label="Số năm kinh nghiệm" required error={errors.experienceYears?.message}>
          {(id, d) => (
            <TextInput id={id} type="number" min={0} max={50} aria-describedby={d} aria-invalid={!!errors.experienceYears} disabled={busy} {...register("experienceYears", { valueAsNumber: true })} />
          )}
        </Field>
        <Field label="Địa điểm" error={errors.location?.message}>
          {(id, d) => <TextInput id={id} aria-describedby={d} aria-invalid={!!errors.location} placeholder="TP. Hồ Chí Minh" disabled={busy} {...register("location")} />}
        </Field>
        <Field label="Chuyên môn" error={errors.specializations?.message} hint="Nhấn Enter hoặc dấu phẩy để thêm." className="sm:col-span-2">
          {(id, d) => (
            <Controller
              control={control}
              name="specializations"
              render={({ field }) => (
                <SpecializationInput id={id} describedBy={d} value={field.value} onChange={field.onChange} disabled={busy} invalid={!!errors.specializations} />
              )}
            />
          )}
        </Field>
        <Field label="Giới thiệu" error={errors.bio?.message} hint={`${bioLength}/600 ký tự`} className="sm:col-span-2">
          {(id, d) => <TextArea id={id} aria-describedby={d} aria-invalid={!!errors.bio} rows={5} disabled={busy} {...register("bio")} />}
        </Field>
      </form>
    </Modal>
  );
}
